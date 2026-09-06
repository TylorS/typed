import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as Pull from "effect/Pull";
import * as Ref from "effect/Ref";
import * as Result from "effect/Result";
import * as Schedule from "effect/Schedule";
import { make as makeSink, type Sink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Retries the entire stream when its Cause contains a typed `Fail` accepted by
 * `schedule`.
 *
 * The schedule is reset as soon as the first element of an attempt is emitted,
 * matching Effect `Stream.retry`.
 *
 * @remarks
 * ## Why
 *
 * Retrying the whole producer, rather than a single value callback, gives a
 * Schedule the typed failure that ended an attempt and lets it control backoff.
 *
 * ## Ownership and lifetime
 *
 * Attempts are sequential and reuse the same downstream sink. The first Fail
 * found anywhere in the Cause is offered to the Schedule, so a composite Cause
 * containing that Fail can be retried even when it also contains defects or
 * interrupts; starting a new attempt discards the whole prior Cause. A Cause
 * without a Fail terminates immediately. Schedule completion re-emits the last
 * source Cause, while Schedule failure terminates with its own cause. Emitting
 * any value resets the Schedule. External interruption cancels the active
 * attempt or backoff sleep.
 *
 * @example
 * ```ts
 * import { Schedule } from "effect"
 * import { retry } from "@typed/fx/Fx"
 * import { fail } from "@typed/fx/Fx"
 *
 * const retried = retry(fail("offline"), Schedule.recurs(2))
 * ```
 *
 * @example A composite Cause is retryable when it contains a Fail
 * ```ts
 * import { Cause, Schedule } from "effect"
 * import { retry } from "@typed/fx/Fx"
 * import { failCause } from "@typed/fx/Fx"
 *
 * const composite = Cause.combine(Cause.fail("offline"), Cause.die("decoder defect"))
 * const retried = retry(failCause(composite), Schedule.recurs(2))
 * ```
 *
 * @since 1.0.0
 * @category Errors and recovery
 */
export const retry: {
  <E, X, E2, R2>(
    schedule: Schedule.Schedule<X, E, E2, R2>,
  ): <A, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, X, E2, R2>(
    self: Fx<A, E, R>,
    schedule: Schedule.Schedule<X, E, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, X, E2, R2>(
    self: Fx<A, E, R>,
    schedule: Schedule.Schedule<X, E, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>(<RSink>(sink: Sink<A, E | E2, RSink>) =>
      Effect.gen(function* () {
        const stepRef = yield* Ref.make<(input: E) => Pull.Pull<X, E2, X, R2>>(
          yield* Schedule.toStepWithSleep(schedule),
        );

        const reset = Effect.flatMap(Schedule.toStepWithSleep(schedule), (step) =>
          Ref.set(stepRef, step),
        );

        const attempt = (): Effect.Effect<unknown, never, R | R2 | RSink> =>
          self.run(
            makeSink(
              (cause: Cause.Cause<E>) => {
                const found = Cause.findFail(cause);
                if (Result.isFailure(found)) {
                  return sink.onFailure(cause);
                }
                return Effect.flatMap(Ref.get(stepRef), (step) =>
                  Pull.matchEffect(step(found.success.error), {
                    onSuccess: () => attempt(),
                    onFailure: (stepCause) => sink.onFailure(stepCause),
                    onDone: () => sink.onFailure(cause),
                  }),
                );
              },
              (a: A) => reset.pipe(Effect.andThen(sink.onSuccess(a))),
            ),
          );

        yield* attempt();
      }),
    ),
);
