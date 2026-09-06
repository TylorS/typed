import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { slice } from "./slice.js";
import { unwrap } from "./unwrap.js";

/**
 * Takes the first `n` elements from an Fx and then completes.
 *
 * @remarks
 * ## Why
 * `take` bounds cardinality without buffering: it forwards at most the first `n` values in order and
 * then completes the run early.
 *
 * ## Ownership and lifetime
 * A per-run counter owns no external resource. Reaching the limit interrupts/stops upstream work;
 * source failures before that point and consumer interruption remain observable.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const firstTwo = Fx.fromIterable([1, 2, 3]).pipe(Fx.take(2))
 * ```
 *
 * @param n - The number of elements to take.
 * @returns An `Fx` that emits at most `n` elements.
 * @since 1.0.0
 * @category Selecting values
 */
export const take: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;

  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R> => slice(fx, { skip: 0, take: n }));

/**
 * Takes the first `n` elements where `n` is produced by an Effect.
 *
 * @remarks
 * ## Why
 * `takeEffect` obtains a dynamic bound once before subscribing, then applies ordinary `take`.
 *
 * ## Ownership and lifetime
 * The count Effect can fail, require services, or be interrupted; in those cases upstream never
 * starts. After success, reaching the limit stops upstream work.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const first = Fx.fromIterable([1, 2]).pipe(Fx.takeEffect(Effect.succeed(1)))
 * ```
 *
 * @param count - Effect that produces the number of elements to take.
 * @returns An `Fx` that emits at most `n` elements.
 * @since 1.0.0
 * @category Selecting values
 */
export const takeEffect: {
  <E2, R2>(
    count: Effect.Effect<number, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, count: Effect.Effect<number, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, count: Effect.Effect<number, E2, R2>): Fx<A, E | E2, R | R2> =>
    unwrap(Effect.map(count, (n) => take(fx, n))),
);
