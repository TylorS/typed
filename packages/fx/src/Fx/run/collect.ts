import * as Effect from "effect/Effect";
import type * as Fiber from "effect/Fiber";
import { dual } from "effect/Function";
import { take } from "../combinators/take.js";
import type { Fx } from "../Fx.js";
import { observe } from "./observe.js";

/**
 * Collects all values emitted by an `Fx` into an array.
 *
 * @remarks
 * ## Why
 *
 * Finite producers sometimes need to cross from push processing back to one Effect
 * value. `collectAll` makes that buffering explicit rather than hiding it in `Fx`.
 *
 * ## Ownership and lifetime
 *
 * The array is allocated separately for each Effect run. Subscription starts when the
 * Effect runs and ends on source completion, failure, or interruption. Every emitted
 * value is retained until completion, so an infinite source never completes and can
 * grow memory without bound. Failures and services remain in `E` and `R`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { collectAll, fromIterable } from "@typed/fx/Fx"
 *
 * const program = collectAll(fromIterable([1, 2, 3])).pipe(
 *   Effect.map((values) => values.reduce((sum, value) => sum + value, 0))
 * )
 * ```
 *
 * @param fx - The `Fx` to collect values from.
 * @returns An `Effect` that produces an array of all values when the `Fx` completes.
 * @since 1.0.0
 * @category Collecting values
 */
export const collectAll = <A, E = never, R = never>(
  fx: Fx<A, E, R>,
): Effect.Effect<ReadonlyArray<A>, E, R> =>
  Effect.suspend(() => {
    const values: Array<A> = [];

    return fx.pipe(
      observe((value) => Effect.sync(() => values.push(value))),
      Effect.map(() => values),
    );
  });

/**
 * Forks the collection of all values from an `Fx`.
 *
 * @remarks
 * ## Why
 *
 * Collection can proceed concurrently while the caller retains a typed `Fiber` for
 * awaiting, polling, or interruption.
 *
 * ## Ownership and lifetime
 *
 * Running the returned Effect starts a child fiber immediately. The parent fiber's
 * scope supervises it, so parent termination interrupts collection. The child retains
 * every value until completion and exposes source failure as its `E` channel.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import { collectAllFork, fromIterable } from "@typed/fx/Fx"
 *
 * const program = Effect.gen(function* () {
 *   const fiber = yield* collectAllFork(fromIterable([1, 2, 3]))
 *   return yield* Fiber.join(fiber)
 * })
 * ```
 *
 * @param fx - The `Fx` to collect values from.
 * @returns An `Effect` that produces a `Fiber` which computes the array of values.
 * @since 1.0.0
 * @category Collecting values
 */
export const collectAllFork = <A, E = never, R = never>(
  fx: Fx<A, E, R>,
): Effect.Effect<Fiber.Fiber<ReadonlyArray<A>, E>, never, R> =>
  Effect.forkChild(collectAll(fx), {
    startImmediately: true,
    uninterruptible: false,
  });

/**
 * Collects the first `n` values emitted by an `Fx` into an array.
 *
 * @remarks
 * ## Why
 *
 * `collectUpTo` creates a bounded pull result from a push source and stops upstream as
 * soon as the requested cardinality has arrived.
 *
 * ## Ownership and lifetime
 *
 * Each Effect run owns a fresh array and source subscription. At most `upTo` values
 * are retained in producer order; reaching the bound requests early exit and cleans
 * up upstream. If the source completes first, the shorter array is returned. Source
 * failures before completion remain typed.
 *
 * @example
 * ```ts
 * import { collectUpTo, fromIterable } from "@typed/fx/Fx"
 *
 * const firstTwo = collectUpTo(fromIterable([1, 2, 3]), 2)
 * ```
 *
 * @param fx - The `Fx` to collect values from.
 * @param upTo - The maximum number of values to collect.
 * @returns An `Effect` that produces an array of up to `n` values.
 * @since 1.0.0
 * @category Collecting values
 */
export const collectUpTo: {
  (upTo: number): <A, E, R>(fx: Fx<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>;

  <A, E, R>(fx: Fx<A, E, R>, upTo: number): Effect.Effect<ReadonlyArray<A>, E, R>;
} = dual(
  2,
  <A, E, R>(fx: Fx<A, E, R>, upTo: number): Effect.Effect<ReadonlyArray<A>, E, R> =>
    fx.pipe(take(upTo), collectAll),
);

/**
 * Forks the collection of up to `n` values from an `Fx`.
 *
 * @remarks
 * ## Why
 *
 * A bounded collection can run concurrently while the caller keeps control through
 * the returned fiber.
 *
 * ## Ownership and lifetime
 *
 * Running the Effect starts a supervised child immediately. It retains at most
 * `upTo` values, stops upstream at the bound, and is interrupted when its parent
 * terminates. Source failures are reported by the child fiber.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import { collectUpToFork, periodic } from "@typed/fx/Fx"
 *
 * const program = Effect.gen(function* () {
 *   const fiber = yield* collectUpToFork(periodic("10 millis"), 2)
 *   return yield* Fiber.join(fiber)
 * })
 * ```
 *
 * @param fx - The `Fx` to collect values from.
 * @param upTo - The maximum number of values to collect.
 * @returns An `Effect` that produces a `Fiber` which computes the array of values.
 * @since 1.0.0
 * @category Collecting values
 */
export const collectUpToFork = <A, E = never, R = never>(
  fx: Fx<A, E, R>,
  upTo: number,
): Effect.Effect<Fiber.Fiber<ReadonlyArray<A>, E>, never, R> =>
  Effect.forkChild(collectUpTo(fx, upTo), {
    startImmediately: true,
    uninterruptible: false,
  });
