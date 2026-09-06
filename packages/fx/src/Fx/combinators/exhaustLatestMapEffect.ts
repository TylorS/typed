import type * as Effect from "effect/Effect";
import { dual, flow } from "effect/Function";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { exhaustLatestMap } from "./exhaustLatestMap.js";
import type { FlatMapEffectLike } from "./flatMapEffect.js";

/**
 * Maps each element to an Effect, running one now and retaining only the latest waiting value.
 *
 * @remarks
 * ## Why
 *
 * This is the Effect-producing form of {@link exhaustLatestMap}: it serializes
 * Effects while bounding pending work to one replaceable latest request.
 *
 * ## Admission, buffering, and cardinality
 *
 * The first value while idle starts one Effect. While it runs, each callback is
 * evaluated and the constructed Effect replaces the single pending Effect. Each
 * admitted Effect emits exactly one successful result; superseded pending
 * Effects never run and emit nothing.
 *
 * ## Ownership and lifetime
 *
 * Source and admitted Effect failures remain typed, as do callback service
 * requirements. The required `Scope` owns the active Effect; source completion
 * drains the final pending value, while interruption discards pending work and
 * runs active finalizers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const refreshes = Fx.mergeAll(
 *   Fx.at("v1", "0 millis"),
 *   Fx.at("v2", "5 millis"),
 *   Fx.at("v3", "10 millis")
 * )
 * const indexed = Fx.exhaustLatestMapEffect(refreshes, (version) =>
 *   Effect.as(Effect.sleep("20 millis"), `indexed:${version}`)
 * )
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(indexed))).then(console.log)
 * // ["indexed:v1", "indexed:v3"]
 * ```
 *
 * @param f - A function that maps an element `A` to an `Effect<B>`.
 * @returns An `Fx` that emits the results of the effects.
 * @since 1.0.0
 * @category Concurrent work
 */
export const exhaustLatestMapEffect: FlatMapEffectLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => exhaustLatestMap(self, flow(f, fromEffect)),
);
