import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as FiberHandle from "effect/FiberHandle";
import { dual } from "effect/Function";
import * as Ref from "effect/Ref";
import type * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { empty } from "../constructors/empty.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

const runTimed = <A, E, R, B, E2, R2>(
  self: Fx<A, E, R>,
  duration: Duration.Duration,
  fallback: Fx<B, E2, R2> | undefined,
): Fx<A | B, E | E2, R | R2 | Scope.Scope> =>
  make<A | B, E | E2, R | R2 | Scope.Scope>(
    Effect.fn(function* (sink) {
      const timedOut = yield* Ref.make(false);
      const sourceFiber = yield* Ref.make<Fiber.Fiber<unknown, never> | null>(null);
      const timer = yield* FiberHandle.make();

      const onTimeout = Effect.gen(function* () {
        yield* Ref.set(timedOut, true);
        const fiber = yield* Ref.get(sourceFiber);
        if (fiber) yield* Fiber.interrupt(fiber);
      });

      const arm = FiberHandle.run(timer, Effect.sleep(duration).pipe(Effect.andThen(onTimeout)));

      const fiber = yield* Effect.forkChild(
        self.run(
          makeSink(
            (cause) =>
              Effect.flatMap(Ref.get(timedOut), (didTimeout) =>
                didTimeout ? Effect.void : sink.onFailure(cause),
              ),
            (a: A) => sink.onSuccess(a).pipe(Effect.andThen(arm)),
          ),
        ),
      );
      yield* Ref.set(sourceFiber, fiber);
      yield* arm;

      yield* Fiber.join(fiber).pipe(Effect.catchCause(() => Effect.void));
      yield* FiberHandle.clear(timer);

      if ((yield* Ref.get(timedOut)) && fallback !== undefined) {
        yield* fallback.run(sink);
      }
    }, extendScope),
  );

/**
 * Completes the stream if it does not produce a value (or complete) within
 * `duration` of the previous event. Matches Effect `Stream.timeout`.
 *
 * The timeout is reset after each emission. An infinite duration is a no-op;
 * a zero duration completes immediately.
 *
 * @remarks
 * ## Why
 *
 * Silence is meaningful in push systems. This operator turns an idle period
 * into normal completion without inventing an error type.
 *
 * ## Ownership and lifetime
 *
 * Subscription starts the source and one scoped timer. Each delivered value
 * forwards immediately and rearms the timer. If the timer wins, it interrupts
 * the source and the result completes; the interrupt caused by that timeout is
 * not forwarded. Source failure before the deadline propagates. Interruption
 * clears both source fiber and timer. Infinite duration returns the source;
 * zero duration never starts it.
 *
 * @example
 * ```ts
 * import { timeout } from "@typed/fx/Fx"
 * import { periodic } from "@typed/fx/Fx"
 *
 * const bounded = timeout(periodic("1 second"), "250 millis")
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const timeout: {
  (duration: Duration.Input): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope>;
} = dual(2, <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope> => {
  const d = Duration.fromInputUnsafe(duration);
  if (!Duration.isFinite(d)) return self;
  if (Duration.isZero(d)) return empty;
  return runTimed(self, d, undefined);
});

/**
 * Switches to `fallback` if the source does not produce a value within
 * `duration` of the previous event. Matches Effect `Stream.timeoutOrElse`
 * and RxJS `timeoutTo`.
 *
 * @remarks
 * ## Why
 *
 * A fallback lets an idle producer hand ownership to another push source while
 * preserving both sources' precise values, failures, and services.
 *
 * ## Ownership and lifetime
 *
 * The source and resettable timer start first. On timeout the source is
 * interrupted, then one fallback subscription starts; the two producers never
 * overlap. A source failure before timeout propagates and does not start the
 * fallback. Interruption stops the active producer and timer. Infinite duration
 * returns the source unchanged; zero duration returns the fallback without
 * starting the source.
 *
 * @example
 * ```ts
 * import { timeoutTo } from "@typed/fx/Fx"
 * import { periodic, succeed } from "@typed/fx/Fx"
 *
 * const available = timeoutTo(periodic("1 second"), "250 millis", succeed("offline"))
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const timeoutTo: {
  <B, E2, R2>(
    duration: Duration.Input,
    fallback: Fx<B, E2, R2>,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<A | B, E | E2, R | R2 | Scope.Scope>;
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    duration: Duration.Input,
    fallback: Fx<B, E2, R2>,
  ): Fx<A | B, E | E2, R | R2 | Scope.Scope>;
} = dual(
  3,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    duration: Duration.Input,
    fallback: Fx<B, E2, R2>,
  ): Fx<A | B, E | E2, R | R2 | Scope.Scope> => {
    const d = Duration.fromInputUnsafe(duration);
    if (!Duration.isFinite(d)) return self;
    if (Duration.isZero(d)) return fallback;
    return runTimed(self, d, fallback);
  },
);
