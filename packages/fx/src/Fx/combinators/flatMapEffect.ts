import type * as Effect from "effect/Effect";
import { dual, flow } from "effect/Function";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { flatMap } from "./flatMap.js";

/**
 * Describes a dual flattening operator whose callback returns an Effect.
 *
 * @remarks
 * ## Why
 *
 * The shared type gives Effect-producing merge, concat, switch, and exhaust
 * operators the same data-first and data-last surface while retaining callback
 * errors and services in the returned Fx.
 *
 * ## Ownership and lifetime
 *
 * The type acquires no resources. Implementations adapt each Effect to a
 * one-value Fx whose execution is owned by the returned Fx's required `Scope`.
 * @since 1.0.0
 * @category Type contracts
 */
export type FlatMapEffectLike<Args extends ReadonlyArray<any> = []> = {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    ...args: Args
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    ...args: Args
  ): Fx<B, E | E2, R | R2 | Scope.Scope>;
};

/**
 * Maps each element of an Fx to an Effect, and merges the results.
 *
 * @remarks
 * ## Why
 *
 * This is the Effect-producing form of {@link flatMap}. It admits independent
 * Effects directly without callers manually applying `Fx.fromEffect`.
 *
 * ## Concurrency, ordering, and cardinality
 *
 * Every source value starts one Effect with unbounded concurrency. Each
 * successful Effect emits exactly one value. Results appear in completion order,
 * not source order, and no output buffer restores ordering.
 *
 * ## Ownership and lifetime
 *
 * Source and callback failures remain typed and callback services are unioned
 * with source services. The required `Scope` owns all running Effects; source
 * completion waits for them, and interruption runs every Effect finalizer.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const loaded = Fx.flatMapEffect(Fx.fromIterable([
 *   { id: "slow", wait: "20 millis" as const },
 *   { id: "fast", wait: "1 millis" as const }
 * ]), ({ id, wait }) => Effect.as(Effect.sleep(wait), id))
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(loaded))).then(console.log)
 * // ["fast", "slow"]
 * ```
 *
 * @param f - A function that maps an element `A` to an `Effect<B>`.
 * @returns An `Fx` that emits the results of the effects.
 * @since 1.0.0
 * @category Concurrent work
 */
export const flatMapEffect: FlatMapEffectLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => flatMap(self, flow(f, fromEffect)),
);
