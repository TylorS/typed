import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { slice } from "./slice.js";
import { unwrap } from "./unwrap.js";

/**
 * Skips the first `n` elements of an Fx.
 *
 * @remarks
 * ## Why
 * `skip` discards only the first `n` pushes, then forwards every later value in source order.
 *
 * ## Ownership and lifetime
 * A counter is local to each run and no resource is acquired. Completion, failure, services, and
 * interruption otherwise follow the source.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const tail = Fx.fromIterable([1, 2, 3]).pipe(Fx.skip(1))
 * ```
 *
 * @param n - The number of elements to skip.
 * @returns An `Fx` that emits values after the first `n` elements.
 * @since 1.0.0
 * @category Selecting values
 */
export const skip: {
  (n: number): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;

  <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, n: number): Fx<A, E, R> =>
  slice(fx, { skip: n, take: Infinity }),
);

/**
 * Skips the first `n` elements where `n` is produced by an Effect.
 *
 * @remarks
 * ## Why
 * `skipEffect` obtains the prefix length at consumption time before subscribing to the source.
 *
 * ## Ownership and lifetime
 * The count Effect runs once per run and can fail, require services, or be interrupted. The source
 * is acquired only after the count succeeds.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const tail = Fx.fromIterable([1, 2]).pipe(Fx.skipEffect(Effect.succeed(1)))
 * ```
 *
 * @param count - Effect that produces the number of elements to skip.
 * @returns An `Fx` that emits values after the first `n` elements.
 * @since 1.0.0
 * @category Selecting values
 */
export const skipEffect: {
  <E2, R2>(
    count: Effect.Effect<number, E2, R2>,
  ): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, count: Effect.Effect<number, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(fx: Fx<A, E, R>, count: Effect.Effect<number, E2, R2>): Fx<A, E | E2, R | R2> =>
    unwrap(Effect.map(count, (n) => skip(fx, n))),
);
