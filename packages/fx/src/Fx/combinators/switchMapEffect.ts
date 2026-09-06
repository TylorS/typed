import type * as Effect from "effect/Effect";
import { dual, flow } from "effect/Function";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import type { FlatMapEffectLike } from "./flatMapEffect.js";
import { switchMap } from "./switchMap.js";

/**
 * Maps each element of an Fx to an Effect, and switches to the latest effect.
 *
 * When a new element is emitted, the previous effect is cancelled.
 *
 * @remarks
 * ## Why
 *
 * This is the Effect-producing form of {@link switchMap}. It makes latest-only
 * Effect execution explicit without wrapping callbacks with `Fx.fromEffect`.
 *
 * ## Switching and cardinality
 *
 * Every source value creates one callback Effect. A new value interrupts and
 * awaits the previous Effect before starting its replacement. Each Effect can
 * emit one successful result, but an interrupted Effect may emit none.
 *
 * ## Ownership and lifetime
 *
 * Source and current callback failures remain typed and callback services are
 * added to requirements. The required `Scope` owns the current Effect. Source
 * completion waits for it; replacement and output interruption run its
 * finalizers before relinquishing the lifetime.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const queries = Fx.mergeAll(
 *   Fx.at("a", "0 millis"),
 *   Fx.at("ab", "5 millis")
 * )
 * const result = Fx.switchMapEffect(queries, (query) =>
 *   Effect.as(Effect.sleep("20 millis"), query).pipe(
 *     Effect.ensuring(Effect.log(`${query} closed`))
 *   )
 * )
 * Effect.runPromise(Effect.scoped(Fx.collectAll(result))).then(console.log)
 * // ["ab"]
 * ```
 *
 * @param f - A function that maps an element `A` to an `Effect<B>`.
 * @returns An `Fx` that emits the results of the latest effect.
 * @since 1.0.0
 * @category Concurrent work
 */
export const switchMapEffect: FlatMapEffectLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => switchMap(self, flow(f, fromEffect)),
);
