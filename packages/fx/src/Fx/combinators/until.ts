import { Cause, Deferred, Effect, Exit, Fiber, Ref, Scope } from "effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { observe } from "../run/observe.js";
import { take } from "./take.js";

/**
 * Forwards `events` until `signal` emits, then interrupts `events`.
 *
 * @remarks
 * ## Why
 * `until` gives an event source an external stop boundary. Event values retain their order until
 * the first signal; the signal itself is not emitted and the event run then completes by interruption.
 *
 * ## Ownership and lifetime
 * Both sources start behind one gate in a private Scope. Event completion cancels the signal;
 * signaling cancels events; failures are forwarded unless they are the expected cancellation.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const bounded = Fx.until(Fx.fromIterable([1, 2, 3]), Fx.succeed("stop"))
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const until: {
  <B, E2, R2>(signal: Fx<B, E2, R2>): <A, E, R>(events: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>(
      Effect.fn(function* (sink) {
        const scope = yield* Scope.make();
        const cancellingSignal = yield* Ref.make(false);

        yield* Effect.gen(function* () {
          const startupGate = yield* Deferred.make<void>();
          const eventsFiberRef = yield* Ref.make<Fiber.Fiber<unknown, never> | null>(null);
          const signaled = yield* Ref.make(false);

          const stopEvents = Effect.uninterruptible(
            Effect.gen(function* () {
              yield* Ref.set(signaled, true);
              const eventsFiber = yield* Ref.get(eventsFiberRef);
              if (eventsFiber !== null) yield* Fiber.interrupt(eventsFiber);
            }),
          );

          const signalFiber = yield* Effect.forkIn(
            Deferred.await(startupGate).pipe(
              Effect.andThen(
                signal.pipe(
                  take(1),
                  observe(() => stopEvents),
                ),
              ),
              Effect.catchCause((cause) =>
                Effect.flatMap(Ref.get(cancellingSignal), (didCancelSignal) =>
                  didCancelSignal
                    ? Effect.failCause(cause)
                    : Effect.uninterruptible(
                        sink.onFailure(cause).pipe(Effect.andThen(stopEvents)),
                      ),
                ),
              ),
            ),
            scope,
          );
          const eventsFiber = yield* Effect.forkIn(
            Deferred.await(startupGate).pipe(Effect.andThen(events.run(sink))),
            scope,
          );

          yield* Ref.set(eventsFiberRef, eventsFiber);
          yield* Deferred.succeed(startupGate, undefined);

          const eventsExit = yield* Fiber.await(eventsFiber);
          yield* Ref.set(cancellingSignal, true);
          yield* Fiber.interrupt(signalFiber);

          if (Exit.isFailure(eventsExit)) {
            const didSignal = yield* Ref.get(signaled);
            if (!(didSignal && Cause.hasInterruptsOnly(eventsExit.cause))) {
              return yield* Effect.failCause(eventsExit.cause);
            }
          }
        }).pipe(
          Effect.onExit((exit) =>
            Ref.set(cancellingSignal, true).pipe(Effect.andThen(Scope.close(scope, exit))),
          ),
        );
      }),
    ),
);
