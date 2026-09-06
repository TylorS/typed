import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Pull from "effect/Pull";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import { make as makeSink, type Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Repeats the entire stream according to `schedule` after each successful
 * completion. Failures are not repeated.
 *
 * `Schedule.recurs(n)` runs the stream `n + 1` times (the original plus `n`
 * repeats), matching Effect `Stream.repeat`.
 *
 * @remarks
 * ## Why
 *
 * Repetition is a subscription-level decision: after one producer completes,
 * a Schedule decides whether and when a fresh run should begin. Keeping that
 * decision in Effect's Schedule preserves typed timing services and failures.
 *
 * ## Ownership and lifetime
 *
 * Runs are strictly sequential. Every source value is forwarded before the
 * Schedule is stepped with `void`; a successful step sleeps as configured and
 * starts a new source run. A source failure stops immediately and is never
 * repeated. Schedule failure is forwarded; Schedule completion ends normally.
 * Interruption cancels the active source or schedule sleep. No runs overlap.
 *
 * @example
 * ```ts
 * import { Schedule } from "effect"
 * import { repeat } from "@typed/fx/Fx"
 * import { succeed } from "@typed/fx/Fx"
 *
 * const threeTicks = repeat(succeed("tick"), Schedule.recurs(2))
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const repeat: {
  <X, E2, R2>(
    schedule: Schedule.Schedule<X, void, E2, R2>,
  ): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, X, E2, R2>(
    self: Fx<A, E, R>,
    schedule: Schedule.Schedule<X, void, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, X, E2, R2>(
    self: Fx<A, E, R>,
    schedule: Schedule.Schedule<X, void, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>(<RSink>(sink: Sink<A, E | E2, RSink>) =>
      Effect.gen(function* () {
        const step = yield* Schedule.toStepWithSleep(schedule);
        const failed = yield* Ref.make(false);

        const run = (): Effect.Effect<unknown, never, R | R2 | RSink> =>
          self
            .run(
              makeSink(
                (cause) => Ref.set(failed, true).pipe(Effect.andThen(sink.onFailure(cause))),
                sink.onSuccess,
              ),
            )
            .pipe(
              Effect.flatMap(() =>
                Effect.flatMap(Ref.get(failed), (didFail) => {
                  if (didFail) return Effect.void;
                  return Pull.matchEffect(step(undefined), {
                    onSuccess: run,
                    onFailure: sink.onFailure,
                    onDone: () => Effect.void,
                  });
                }),
              ),
            );

        yield* run();
      }),
    ),
);
