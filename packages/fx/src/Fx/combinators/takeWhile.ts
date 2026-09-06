import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { takeUntil, takeUntilEffect } from "./takeUntil.js";

/**
 * Takes elements from an Fx while a predicate returns true.
 * Stops at the first element for which the predicate returns false; that element is not included.
 *
 * @remarks
 * ## Why
 * `takeWhile` emits the longest matching prefix, in order, and completes before the first false
 * value. It is the predicate complement of `takeUntil`.
 *
 * ## Ownership and lifetime
 * A false result stops upstream immediately. The pure predicate acquires no resources and adds no
 * failures or services.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * const small = Fx.fromIterable([1, 2, 3]).pipe(Fx.takeWhile((n) => n < 3))
 * ```
 *
 * @param predicate - The predicate function.
 * @returns An `Fx` that emits while the predicate holds.
 * @since 1.0.0
 * @category Selecting values
 */
export const takeWhile: {
  <A>(predicate: (a: A) => boolean): <E, R>(fx: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, predicate: (a: A) => boolean): Fx<A, E, R> =>
  takeUntil(fx, (a) => !predicate(a)),
);

/**
 * Takes elements from an Fx while an effectful predicate returns true.
 * Stops at the first element for which the predicate effect succeeds with false; that element is not included.
 *
 * @remarks
 * ## Why
 * `takeWhileEffect` performs the prefix decision with Effect and completes before the first false
 * value, retaining source order.
 *
 * ## Ownership and lifetime
 * Predicate effects expose their failures and services and are interrupted with the run. A false
 * result stops upstream; no independent fiber or buffer is retained.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 * const small = Fx.fromIterable([1, 2]).pipe(Fx.takeWhileEffect((n) => Effect.succeed(n < 2)))
 * ```
 *
 * @param predicate - Effectful predicate function.
 * @returns An `Fx` that emits while the predicate holds.
 * @since 1.0.0
 * @category Selecting values
 */
export const takeWhileEffect: {
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
  ): Fx<A, E | E2, R | R2> => takeUntilEffect(fx, (a) => Effect.map(predicate(a), (b) => !b)),
);
