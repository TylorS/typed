import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Effectfully loops over the failure causes of an Fx with an accumulator.
 *
 * @remarks
 * ## Why
 * `loopCauseEffect` allows cause transformation to consult services or perform Effects while
 * retaining state between failures. It does not serialize concurrent failure deliveries, so
 * overlapping callbacks can read the same seed and commit in completion order.
 *
 * ## Ownership and lifetime
 * One mutable seed belongs to each run. Required services remain in the result; callback failure is
 * delivered to the Sink, and interruption follows each producer delivery without adding a lock.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const observed = Fx.fail("offline").pipe(Fx.loopCauseEffect(0, (n, cause) => Effect.succeed([cause, n + 1])))
 * ```
 *
 * @param seed - The initial state.
 * @param f - The effectful loop function for causes.
 * @returns An `Fx` with transformed errors.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const loopCauseEffect: {
  <B, A, E, R2, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => Effect.Effect<readonly [Cause.Cause<C>, B], R2>,
  ): <R>(self: Fx<A, E, R>) => Fx<A, C | E, R | R2>;

  <A, E, R, B, R2, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R2>,
  ): Fx<A, C, R | R2>;
} = dual(
  3,
  <A, E, R, B, R2, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => Effect.Effect<readonly [Cause.Cause<C>, B], E, R2>,
  ): Fx<A, C | E, R | R2> =>
    make<A, C | E, R | R2>((sink) => self.run(sinkCore.loopCauseEffect(sink, seed, f))),
);
