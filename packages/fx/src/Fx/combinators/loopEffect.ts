import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Effectfully loops over an Fx with an accumulator, producing a new value for each element.
 *
 * @remarks
 * ## Why
 * `loopEffect` models an Effectful state transition without nested Fx values. It does not serialize
 * producer callbacks: overlapping deliveries can read the same seed, complete out of order, and
 * overwrite one another's next state. Use a serialized producer when atomic accumulation matters.
 *
 * ## Ownership and lifetime
 * One mutable seed is retained per run. Each callback Effect follows its invoking delivery; failure
 * is sent to the Sink, services remain required, and interruption does not provide a global lock.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const concurrent = Fx.make<number>((sink) =>
 *   Effect.all([sink.onSuccess(1), sink.onSuccess(2)], { concurrency: "unbounded", discard: true })
 * )
 * const program = Fx.collectAll(
 *   concurrent.pipe(Fx.loopEffect(0, (sum, n) => Effect.succeed([sum + n, sum + n])))
 * ) // both overlapping transitions may observe sum === 0
 * ```
 *
 * @param seed - The initial state.
 * @param f - The effectful loop function.
 * @returns An `Fx` emitting the transformed values.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const loopEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E2, R2>,
  ): <E, R>(self: Fx<A, E | E2, R>) => Fx<C, E | E2, R | R2>;

  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>,
  ): Fx<C, E, R>;
} = dual(
  3,
  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [C, B], E, R>,
  ): Fx<C, E, R> => make<C, E, R>((sink) => self.run(sinkCore.loopEffect(seed, f)(sink))),
);
