import * as Effect from "effect/Effect";
import * as FiberSet from "effect/FiberSet";
import { dual } from "effect/Function";
import type * as Scope from "effect/Scope";
import { make as makeSink } from "../../Sink/Sink.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { extendScope } from "../internal/scope.js";

/**
 * Describes a dual flattening operator whose callback returns an Fx.
 *
 * @remarks
 * ## Why
 *
 * The shared type keeps data-first and data-last call styles consistent across
 * merge, concat, switch, and exhaust policies while preserving the callback's
 * success, error, and service channels.
 *
 * ## Ownership and lifetime
 *
 * The type acquires no resources. Implementations return an Fx requiring
 * `Scope`; that Scope owns any admitted inner subscriptions and their cleanup.
 * @since 1.0.0
 * @category Type contracts
 */
export type FlatMapLike<Args extends ReadonlyArray<any> = []> = {
  <A, B, E2, R2>(
    f: (a: A) => Fx<B, E2, R2>,
    ...args: Args
  ): <E, R>(self: Fx<A, E, R>) => Fx<B, E | E2, R | R2 | Scope.Scope>;

  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
    ...args: Args
  ): Fx<B, E | E2, R | R2 | Scope.Scope>;
};

/**
 * Maps each source value to an inner Fx and merges every inner concurrently.
 *
 * @remarks
 * ## Why
 *
 * `flatMap` is the unconstrained merge policy for independent pushed work. It
 * preserves push-based production instead of collecting an inner Fx before the
 * next source value can be handled.
 *
 * ## Concurrency, ordering, and cardinality
 *
 * Every source value creates exactly one inner Fx with no concurrency limit.
 * Each inner retains its own emission order, but values from different inners
 * interleave according to arrival time. There is no output buffer or global
 * ordering guarantee.
 *
 * ## Ownership and lifetime
 *
 * Source and inner failures are forwarded; their required services are unioned.
 * A `FiberSet` in the required `Scope` owns all inner fibers. Source completion
 * waits for the set to empty. Interrupting observation closes the Scope and
 * interrupts every active inner, running each inner Scope's finalizers.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const rows = Fx.flatMap(Fx.fromIterable([
 *   { id: "slow", wait: "20 millis" as const },
 *   { id: "fast", wait: "1 millis" as const }
 * ]), ({ id, wait }) => Fx.at(id, wait))
 *
 * Effect.runPromise(Effect.scoped(Fx.collectAll(rows))).then(console.log)
 * // ["fast", "slow"]: inners overlap and results arrive by production time
 * ```
 *
 * @param f - A function that maps an element `A` to a new `Fx<B>`.
 * @returns An `Fx` that emits values from all inner streams.
 * @since 1.0.0
 * @category Concurrent work
 */
export const flatMap: FlatMapLike = dual(
  2,
  <A, E, R, B, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => Fx<B, E2, R2>,
  ): Fx<B, E | E2, R | R2 | Scope.Scope> =>
    make<B, E | E2, R | R2 | Scope.Scope>(
      Effect.fn(function* (sink) {
        const set = yield* FiberSet.make<void, never>();
        yield* self.run(makeSink(sink.onFailure, (a) => FiberSet.run(set, f(a).run(sink))));
        yield* FiberSet.awaitEmpty(set);
      }, extendScope),
    ),
);
