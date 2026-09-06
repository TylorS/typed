import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { take } from "./take.js";

type Phase = "waiting" | "active" | "stopped";

/**
 * Forwards `events` only between a start signal and that signal's first stop event.
 *
 * @remarks
 * ## Why
 *
 * Push lifetimes are often controlled by other push lifetimes: a pointer move
 * matters between pointer-down and pointer-up, for example. `during` models
 * that gate without converting either side into polling state.
 *
 * ## Ownership and lifetime
 *
 * `events` and the outer `signals` Fx start concurrently in one child Scope.
 * Only the first outer value is used; that value must itself be an Fx, whose
 * first value closes the gate. Event values before the start signal and after
 * the stop signal are discarded. Completion of `events` completes the result.
 * A failure from events, signals, or the selected stop Fx terminates everything;
 * closing or interrupting the returned Fx interrupts all remaining fibers and
 * closes the private Scope.
 *
 * @example
 * ```ts
 * import { during } from "@typed/fx/Fx"
 * import { delay } from "@typed/fx/Fx"
 * import { periodic, succeed } from "@typed/fx/Fx"
 *
 * const pointerMoves = periodic("16 millis")
 * const pointerDown = succeed(delay(succeed(undefined), "1 second"))
 * const activeMoves = during(pointerMoves, pointerDown)
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export function during<A, E, R, Start extends Fx.Any, E2, R2>(
  events: Fx<A, E, R>,
  signals: Fx<Start, E2, R2>,
): Fx<A, E | E2 | Fx.Error<Start>, R | R2 | Fx.Services<Start> | Scope.Scope> {
  type Error = E | E2 | Fx.Error<Start>;
  type Services = R | R2 | Fx.Services<Start> | Scope.Scope;

  return make<A, Error, Services>(
    Effect.fn(function* (sink) {
      const scope = yield* Scope.make();
      yield* Effect.gen(function* () {
        const eventsGate = yield* Deferred.make<void>();
        let phase: Phase = "waiting";
        let stoppedEvents = false;

        const eventsFiber = yield* Effect.forkIn(
          Deferred.await(eventsGate).pipe(
            Effect.andThen(
              events.run(
                makeSink(
                  (cause) =>
                    Effect.suspend(() => {
                      if (phase === "stopped") return Effect.void;
                      phase = "stopped";
                      return sink.onFailure(cause);
                    }),
                  (value) =>
                    Effect.suspend(() =>
                      phase === "active" ? sink.onSuccess(value) : Effect.void,
                    ),
                ),
              ),
            ),
          ),
          scope,
          { startImmediately: true, uninterruptible: false },
        );

        const stopEvents = Effect.uninterruptible(
          Effect.suspend(() => {
            if (phase !== "active") return Effect.void;
            phase = "stopped";
            stoppedEvents = true;
            return Fiber.interrupt(eventsFiber);
          }),
        );
        const failAndStopEvents = (cause: Cause.Cause<Error>) =>
          Effect.uninterruptible(
            Effect.suspend(() => {
              if (phase === "stopped") return Effect.void;
              phase = "stopped";
              stoppedEvents = true;
              return sink.onFailure(cause).pipe(Effect.andThen(Fiber.interrupt(eventsFiber)));
            }),
          );

        yield* Effect.forkIn(
          take(signals, 1).run(
            makeSink(failAndStopEvents, (stopSignal) =>
              Effect.suspend(() => {
                if (phase !== "waiting") return Effect.void;
                phase = "active";
                return Effect.asVoid(
                  Effect.forkIn(
                    take(stopSignal, 1).run(makeSink(failAndStopEvents, () => stopEvents)),
                    scope,
                    { startImmediately: true, uninterruptible: false },
                  ),
                );
              }),
            ),
          ),
          scope,
          { startImmediately: true, uninterruptible: false },
        );

        yield* Deferred.succeed(eventsGate, undefined);
        const eventsExit = yield* Fiber.await(eventsFiber);
        if (
          Exit.isFailure(eventsExit) &&
          !(stoppedEvents && Cause.hasInterruptsOnly(eventsExit.cause))
        ) {
          return yield* Effect.failCause(eventsExit.cause);
        }
      }).pipe(Effect.onExit((exit) => Scope.close(scope, exit)));
    }),
  );
}
