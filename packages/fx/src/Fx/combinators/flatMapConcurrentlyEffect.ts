import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import { dual, flow } from "effect/Function";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { flatMapConcurrently } from "./flatMapConcurrently.js";

/**
 * Maps each element of an Fx to an Effect, running them concurrently with a limit.
 *
 * @remarks
 * ## Why
 *
 * This Effect-producing bounded merge avoids manual `Fx.fromEffect` conversion
 * while making the callback's concurrency budget part of the operation.
 *
 * ## Concurrency, ordering, and cardinality
 *
 * Every source value eventually starts one callback Effect, with no more than
 * `concurrency` active at once. Each success emits exactly one value. Waiting
 * work is retained, and results arrive by completion rather than source order.
 *
 * ## Ownership and lifetime
 *
 * Invalid limits fail with `Cause.IllegalArgumentError`; source and callback
 * failures remain typed and callback services are added to requirements. The
 * required `Scope` owns waiting and active Effects. Completion drains them;
 * interruption cancels them and runs their finalizers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const loaded = Fx.flatMapConcurrentlyEffect(
 *   Fx.fromIterable([
 *     { id: "one", wait: "20 millis" as const },
 *     { id: "two", wait: "20 millis" as const },
 *     { id: "three", wait: "1 millis" as const }
 *   ]),
 *   ({ id, wait }) => Effect.as(Effect.sleep(wait), id),
 *   2
 * )
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(loaded))).then(console.log)
 * // "three" remains queued until a permit is released
 * ```
 *
 * @param f - A function that maps an element `A` to an `Effect<B>`.
 * @param concurrency - A positive safe-integer limit for concurrent effects. Invalid limits fail with `Cause.IllegalArgumentError`.
 * @returns An `Fx` that emits the results of the effects.
 * @since 1.0.0
 * @category Concurrent work
 */
export const flatMapConcurrentlyEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<B, E2, R2>,
    concurrency: number,
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope>;
} = dual(
  3,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
    concurrency: number,
  ): Fx<B, E | E2 | Cause.IllegalArgumentError, R | R2 | Scope.Scope> =>
    flatMapConcurrently(self, flow(f, fromEffect), concurrency),
);
