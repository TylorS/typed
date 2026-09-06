import { dual, flow } from "effect/Function";
import type * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { fromEffect } from "../constructors/fromEffect.js";
import type { Fx } from "../Fx.js";
import { flatMapConcurrently } from "./flatMapConcurrently.js";
import type { FlatMapLike } from "./flatMap.js";
import type { FlatMapEffectLike } from "./flatMapEffect.js";

/**
 * Maps each element to an inner Fx and concatenates the results sequentially.
 *
 * @remarks
 * ## Why
 *
 * `concatMap` is the flattening policy for work that must not overlap: the next
 * source value is admitted only after the current inner Fx completes. It is the
 * bounded-concurrency form of {@link flatMapConcurrently} with a limit of one.
 *
 * ## Ordering and cardinality
 *
 * Every source value creates exactly one inner Fx. Inner values retain both
 * source order and their order within each inner Fx; no inner value is buffered
 * behind a later inner because later inners have not started yet.
 *
 * ## Ownership and lifetime
 *
 * Source and inner failures are forwarded to the output Sink, and both service
 * requirements remain in the returned type. The required `Scope` owns the
 * admitted inner fiber; interruption closes it and prevents queued source work
 * from starting. No values are dropped, switched, or replayed.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const ordered = Fx.concatMap(Fx.fromIterable([
 *   { id: "first", wait: "20 millis" as const },
 *   { id: "second", wait: "1 millis" as const }
 * ]), ({ id, wait }) => Fx.at(id, wait))
 *
 * const program = Effect.scoped(Fx.collectAll(ordered))
 * Effect.runPromise(program).then(console.log)
 * // ["first", "second"]: the one-millisecond inner is not started early
 * ```
 *
 * @since 1.0.0
 * @category Concurrent work
 */
export const concatMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> =>
    flatMapConcurrently(self, f, 1) as Fx<B, E | E2, R | R2 | Scope.Scope>,
);

/**
 * Maps each element to an Effect and concatenates the results sequentially.
 *
 * @remarks
 * ## Why
 *
 * This is the Effect-producing form of {@link concatMap}. It makes serialized
 * commands explicit without requiring callers to wrap each Effect with
 * `Fx.fromEffect`.
 *
 * ## Ordering and cardinality
 *
 * Each source value starts one Effect only after the previous Effect has
 * completed. Each successful Effect emits exactly one value, so output order is
 * source order and there is no overlap or buffering of successful results.
 *
 * ## Ownership and lifetime
 *
 * Source failures and Effect failures remain typed; callback services are added
 * to the output requirements. The returned Fx requires `Scope`, which owns the
 * active callback Effect and interrupts it when observation ends.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const saved = Fx.concatMapEffect(Fx.fromIterable([
 *   { id: "first", wait: "20 millis" as const },
 *   { id: "second", wait: "1 millis" as const }
 * ]), ({ id, wait }) => Effect.as(Effect.sleep(wait), id))
 *
 * const program = Effect.scoped(Fx.collectAll(saved))
 * Effect.runPromise(program).then(console.log)
 * // ["first", "second"]
 * ```
 *
 * @since 1.0.0
 * @category Concurrent work
 */
export const concatMapEffect: FlatMapEffectLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> => concatMap(self, flow(f, fromEffect)),
);
