import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Effectfully loops over an Fx with an accumulator, producing an optional new value.
 *
 * @remarks
 * ## Why
 * `filterMapLoopEffect` makes the state transition Effectful while retaining zero-or-one output per
 * input. It adds no serialization: overlapping producer callbacks can read the same seed, complete
 * out of order, and overwrite one another's next state.
 *
 * ## Ownership and lifetime
 * One mutable seed belongs to each run. Callback Causes are delivered to the Sink, services remain
 * required, and interruption follows each delivery; callers need a serialized producer for atomic state.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const counted = Fx.fromIterable(["a", "b"]).pipe(
 *   Fx.filterMapLoopEffect(0, (count, value) => Effect.succeed([Option.some(`${count}:${value}`), count + 1])),
 * )
 * ```
 *
 * @param seed - The initial state.
 * @param f - The effectful loop function.
 * @returns An `Fx` emitting the transformed values.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const filterMapLoopEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E2, R2>,
  ): <E, R>(self: Fx<A, E | E2, R>) => Fx<C, E | E2, R | R2>;

  <A, E, R, B, R2, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>,
  ): Fx<C, E, R | R2>;
} = dual(
  3,
  <A, E, R, B, R2, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<readonly [Option.Option<C>, B], E, R2>,
  ): Fx<C, E, R | R2> =>
    make<C, E, R | R2>((sink) => self.run(sinkCore.filterMapLoopEffect(sink, seed, f))),
);
