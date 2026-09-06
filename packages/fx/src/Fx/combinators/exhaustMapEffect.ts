import type * as Effect from "effect/Effect";
import { dual, flow } from "effect/Function";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { exhaustMap } from "./exhaustMap.js";
import type { FlatMapEffectLike } from "./flatMapEffect.js";

/**
 * Maps each element of an Fx to an Effect, ignoring new elements until the current effect completes.
 *
 * @remarks
 * ## Why
 *
 * This Effect-producing form of {@link exhaustMap} prevents overlapping command
 * Effects while deliberately applying no queue or latest-value replay policy.
 *
 * ## Admission and cardinality
 *
 * The first value while idle starts one Effect and emits its one successful
 * result. For values received while it runs, `f` is still evaluated to construct
 * an Effect, but that Effect is not run or queued.
 *
 * ## Ownership and lifetime
 *
 * Source and callback Effect failures remain typed and callback services are
 * added to the output requirements. The active Effect is owned by the returned
 * Fx's required `Scope`; completion waits for it and interruption runs its
 * finalizers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const accepted = Fx.exhaustMapEffect(Fx.fromIterable([1, 2]), (id) =>
 *   Effect.as(Effect.sleep("20 millis"), `saved:${id}`)
 * )
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(accepted))).then(console.log)
 * // ["saved:1"]: the second Effect is constructed but not admitted
 * ```
 *
 * @param f - A function that maps an element `A` to an `Effect<B>`.
 * @returns An `Fx` that emits the results of the active effect.
 * @since 1.0.0
 * @category Concurrent work
 */
export const exhaustMapEffect: FlatMapEffectLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => exhaustMap(self, flow(f, fromEffect)),
);
