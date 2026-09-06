import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Emits the latest source value whenever `sampler` emits. Source values that
 * arrive between sampler ticks are not forwarded until the next tick.
 *
 * **Completion:** Completes when the source completes.
 * **Errors:** The first failure from either stream fails the result.
 *
 * @remarks
 * ## Why
 * `sample` separates value production from observation cadence. A sampler tick emits the latest
 * source value once, or nothing before the source's first value; repeated ticks may repeat a value.
 *
 * ## Ownership and lifetime
 * One latest-value cell and a child sampler fiber belong to each run. Source completion interrupts
 * the sampler; any failure or consumer interruption stops both and releases the retained value.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const snapshots = Fx.sample(Fx.fromIterable([10, 20]), Fx.fromIterable(["tick"]))
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const sample: {
  <S, E2, R2>(sampler: Fx<S, E2, R2>): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, S, E2, R2>(self: Fx<A, E, R>, sampler: Fx<S, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, S, E2, R2>(self: Fx<A, E, R>, sampler: Fx<S, E2, R2>): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>(
      Effect.fn(function* (sink) {
        const latest = yield* Ref.make(Option.none<A>());
        const samplerFiber = yield* Effect.forkChild(
          sampler.run(
            makeSink(sink.onFailure, () =>
              Effect.flatMap(Ref.get(latest), (opt) =>
                Option.match(opt, {
                  onNone: () => Effect.void,
                  onSome: (a) => sink.onSuccess(a),
                }),
              ),
            ),
          ),
        );

        yield* self
          .run(makeSink(sink.onFailure, (a: A) => Ref.set(latest, Option.some(a))))
          .pipe(Effect.ensuring(Fiber.interrupt(samplerFiber)));
      }),
    ),
);
