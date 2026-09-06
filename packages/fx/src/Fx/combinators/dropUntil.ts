import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { skipWhile, skipWhileEffect } from "./skipWhile.js";

/**
 * Drops elements from an Fx until a predicate returns true.
 * Emits from the first element for which the predicate returns true (including that element) and all following elements.
 *
 * @remarks
 * ## Why
 * `dropUntil` opens a one-way gate at the first matching value. The match and every later value emit
 * once in source order; after opening, the predicate is no longer consulted.
 *
 * ## Ownership and lifetime
 * The gate is local to one run and discarded on completion or interruption. No resources are
 * acquired and the source's errors and services pass through unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const ready = Fx.fromIterable([1, 2, 3]).pipe(Fx.dropUntil((n) => n >= 2))
 * ```
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that emits once the predicate first matches.
 * @since 1.0.0
 * @category Selecting values
 */
export const dropUntil: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
  skipWhile(fx, (a) => !predicate(a)),
);

/**
 * Drops elements from an Fx until an effectful predicate returns true.
 * Emits from the first element for which the predicate effect succeeds with true (including that element) and all following elements.
 *
 * @remarks
 * ## Why
 * `dropUntilEffect` makes the gate decision Effectful. The first `true` opens the gate and is
 * forwarded, but its `skipWhileEffect` implementation eagerly evaluates the predicate for every
 * later value as well; those later boolean results no longer affect forwarding.
 *
 * ## Ownership and lifetime
 * The gate is per run. Predicate effects inherit producer ordering and concurrency, are interrupted
 * with their invoking delivery, and expose `E2`/`R2`. Failures remain observable after the gate opens.
 *
 * @example
 * ```ts
 * import { Effect, Ref } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const program = Effect.gen(function* () {
 *   const checks = yield* Ref.make(0)
 *   const values = yield* Fx.collectAll(
 *     Fx.fromIterable([2, 3]).pipe(
 *       Fx.dropUntilEffect((n) => Ref.update(checks, (count) => count + 1).pipe(Effect.as(n === 2)))
 *     )
 *   )
 *   return { values, checks: yield* Ref.get(checks) } // { values: [2, 3], checks: 2 }
 * })
 * ```
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that emits once the predicate first matches.
 * @since 1.0.0
 * @category Selecting values
 */
export const dropUntilEffect: {
  <A, E2, R2>(
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): <E, R>(fx: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    fx: Fx<A, E, R>,
    predicate: (a: A) => Effect.Effect<boolean, E2, R2>,
  ): Fx<A, E | E2, R | R2> => skipWhileEffect(fx, (a) => Effect.map(predicate(a), (b) => !b)),
);
