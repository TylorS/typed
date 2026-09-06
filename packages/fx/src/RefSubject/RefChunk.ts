/**
 * Extensions to RefSubject for working with Chunk values
 * @since 1.18.0
 */

import * as Chunk from "effect/Chunk";
import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import type { Equivalence } from "effect/Equivalence";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import type * as Order from "effect/Order";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";
import { Result } from "effect";

/**
 * A RefChunk is a RefSubject specialized over a Chunk of values.
 * @remarks
 * ## Why
 *
 * Defines chunk state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefChunk is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefChunk<in out A, in out E = never, out R = never> extends RefSubject.RefSubject<
  Chunk.Chunk<A>,
  E,
  R
> {}

/**
 * Creates a new `RefChunk` from a Chunk, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates chunk state with equality suited to that Effect data type, so unchanged values do not
 * produce redundant pushed updates.
 *
 * ## Ownership and lifetime
 *
 * The creation Effect requires Scope. It owns initializer acquisition, live source subscriptions,
 * and cleanup; source failures and services stay on reads and pushes.
 *
 * @since 1.18.0
 * @category Constructors
 */
export function make<A, E = never, R = never>(
  initial: Chunk.Chunk<A> | Effect.Effect<Chunk.Chunk<A>, E, R> | Fx.Fx<Chunk.Chunk<A>, E, R>,
  eq: Equivalence<A> = equals,
): Effect.Effect<RefChunk<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: Chunk.makeEquivalence(eq) });
}

/**
 * Prepend a value to the current state of a RefChunk.
 * @remarks
 * ## Why
 *
 * Expresses prepend as one ordered chunk transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running prepend performs one serialized chunk transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const prepend: {
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function prepend<A, E, R>(ref: RefChunk<A, E, R>, value: A) {
  return RefSubject.update(ref, Chunk.prepend(value));
});

/**
 * Prepend an iterable of values to the current state of a RefChunk.
 * @remarks
 * ## Why
 *
 * Expresses prepend all as one ordered chunk transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running prepend all performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function prependAll<A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, Chunk.prependAll(Chunk.fromIterable(value)));
});

/**
 * Append a value to the current state of a RefChunk.
 * @remarks
 * ## Why
 *
 * Expresses append as one ordered chunk transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running append performs one serialized chunk transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const append: {
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function append<A, E, R>(ref: RefChunk<A, E, R>, value: A) {
  return RefSubject.update(ref, Chunk.append(value));
});

/**
 * Append an iterable of values to the current state of a RefChunk.
 * @remarks
 * ## Why
 *
 * Expresses append all as one ordered chunk transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running append all performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const appendAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function appendAll<A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, Chunk.appendAll(Chunk.fromIterable(value)));
});

/**
 * Drop the first `n` values from a RefChunk.
 * @remarks
 * ## Why
 *
 * Applies drop to the committed chunk value and publishes only the result, preserving its element
 * order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop performs one serialized chunk transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const drop: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function drop<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.drop(n));
});

/**
 * Drop the last `n` values from a RefChunk.
 * @remarks
 * ## Why
 *
 * Applies drop right to the committed chunk value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop right performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dropRight: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function dropRight<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.dropRight(n));
});

/**
 * Drop values from a RefChunk while a predicate is true.
 * @remarks
 * ## Why
 *
 * Applies drop while to the committed chunk value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop while performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dropWhile: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function dropWhile<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.update(ref, Chunk.dropWhile(predicate));
});

/**
 * Take the first `n` values from a RefChunk.
 * @remarks
 * ## Why
 *
 * Applies take to the committed chunk value and publishes only the result, preserving its element
 * order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take performs one serialized chunk transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const take: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function take<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.take(n));
});

/**
 * Take the last `n` values from a RefChunk.
 * @remarks
 * ## Why
 *
 * Applies take right to the committed chunk value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take right performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const takeRight: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function takeRight<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.takeRight(n));
});

/**
 * Take values from a RefChunk while a predicate is true.
 * @remarks
 * ## Why
 *
 * Applies take while to the committed chunk value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take while performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function takeWhile<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.update(ref, Chunk.takeWhile(predicate));
});

/**
 * Modify the value at a particular index of a RefChunk.
 * @remarks
 * ## Why
 *
 * Keeps modify at atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running modify at performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const modifyAt: {
  <A>(
    index: number,
    f: (a: A) => A,
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    index: number,
    f: (a: A) => A,
  ): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(3, function modifyAt<A, E, R>(ref: RefChunk<A, E, R>, index: number, f: (a: A) => A) {
  return RefSubject.update(ref, (chunk) =>
    Option.getOrElse(Chunk.modify(chunk, index, f), () => chunk),
  );
});

/**
 * Replace a value at a particular index of a RefChunk.
 * @remarks
 * ## Why
 *
 * Keeps replace at atomic with respect to competing RefSubject writes instead of splitting the
 * read and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running replace at performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const replaceAt: {
  <A>(index: number, a: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, index: number, a: A): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(3, function replaceAt<A, E, R>(ref: RefChunk<A, E, R>, index: number, a: A) {
  return RefSubject.update(ref, (chunk) =>
    Option.getOrElse(Chunk.replace(chunk, index, a), () => chunk),
  );
});

/**
 * Remove a value at a particular index of a RefChunk.
 * @remarks
 * ## Why
 *
 * Applies remove to the committed chunk value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove performs one serialized chunk transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const remove: {
  (index: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, index: number): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function remove<A, E, R>(ref: RefChunk<A, E, R>, index: number) {
  return RefSubject.update(ref, Chunk.remove(index));
});

/**
 * Filter the values of a RefChunk (mutating).
 * @remarks
 * ## Why
 *
 * Applies filter to the committed chunk through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed chunk and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filter: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function filter<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.update(ref, Chunk.filter(predicate));
});

/**
 * Map (Endomorphic) the values of a RefChunk.
 * @remarks
 * ## Why
 *
 * Applies map to the committed chunk through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed chunk and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A,
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    f: (a: A, index: number) => A,
  ): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function map<A, E, R>(ref: RefChunk<A, E, R>, f: (a: A, index: number) => A) {
  return RefSubject.update(ref, Chunk.map(f));
});

/**
 * Remove duplicate values from a RefChunk.
 * @remarks
 * ## Why
 *
 * Derives the reordered chunk through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running dedupe performs one serialized chunk transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dedupe = <A, E, R>(ref: RefChunk<A, E, R>): Effect.Effect<Chunk.Chunk<A>, E, R> =>
  RefSubject.update(ref, Chunk.dedupe);

/**
 * Remove adjacent duplicate values from a RefChunk.
 * @remarks
 * ## Why
 *
 * Derives the reordered chunk through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running dedupe adjacent performs one serialized chunk transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dedupeAdjacent = <A, E, R>(
  ref: RefChunk<A, E, R>,
): Effect.Effect<Chunk.Chunk<A>, E, R> => RefSubject.update(ref, Chunk.dedupeAdjacent);

/**
 * Reverse the values of a RefChunk.
 * @remarks
 * ## Why
 *
 * Derives the reordered chunk through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running reverse performs one serialized chunk transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const reverse = <A, E, R>(ref: RefChunk<A, E, R>): Effect.Effect<Chunk.Chunk<A>, E, R> =>
  RefSubject.update(ref, Chunk.reverse);

/**
 * Sort the values of a RefChunk using a provided Order.
 * @remarks
 * ## Why
 *
 * Derives the reordered chunk through its Effect collection operation while retaining RefSubject
 * equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running sort performs one serialized chunk transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const sort: {
  <A>(order: Order.Order<A>): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, order: Order.Order<A>): Effect.Effect<Chunk.Chunk<A>, E, R>;
} = dual(2, function sort<A, E, R>(ref: RefChunk<A, E, R>, order: Order.Order<A>) {
  return RefSubject.update(ref, Chunk.sort(order));
});

// ========================================
// Computed
// ========================================

/**
 * Check if a RefChunk is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the chunk; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The is empty view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isEmpty = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Chunk.isEmpty);

/**
 * Check if a RefChunk is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the chunk; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The is non empty view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isNonEmpty = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Chunk.isNonEmpty);

/**
 * Get the current size of a RefChunk.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the chunk; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The size view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const size = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Chunk.size);

/**
 * Map the values of a RefChunk to a different type.
 * @remarks
 * ## Why
 *
 * Projects chunk state with map values for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map values view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const mapValues: {
  <A, B>(
    f: (a: A, index: number) => B,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<Chunk.Chunk<B>, E, R>;
  <A, E, R, B>(
    ref: RefChunk<A, E, R>,
    f: (a: A, index: number) => B,
  ): RefSubject.Computed<Chunk.Chunk<B>, E, R>;
} = dual(2, function mapValues<A, E, R, B>(ref: RefChunk<A, E, R>, f: (a: A, index: number) => B) {
  return RefSubject.map(ref, Chunk.map(f));
});

/**
 * Filter the values of a RefChunk creating a Computed value.
 * @remarks
 * ## Why
 *
 * Projects chunk state with filter values for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The filter values view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const filterValues: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<Chunk.Chunk<A>, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<Chunk.Chunk<A>, E, R>;
} = dual(2, function filterValues<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Chunk.filter(predicate));
});

/**
 * Partition the values of a RefChunk using a predicate.
 * @remarks
 * ## Why
 *
 * Partition the values of a RefChunk using a predicate. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The partition view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const partition: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<[Chunk.Chunk<A>, Chunk.Chunk<A>], E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<[Chunk.Chunk<A>, Chunk.Chunk<A>], E, R>;
} = dual(2, function partition<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Chunk.partition(Result.liftPredicate(predicate, Result.fail)));
});

/**
 * Reduce the values of a RefChunk to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the chunk; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The reduce view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const reduce: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<B, E, R>;
  <A, E, R, B>(
    ref: RefChunk<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<
  A,
  E,
  R,
  B,
>(ref: RefChunk<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
  return RefSubject.map(ref, Chunk.reduce(b, f));
});

/**
 * Reduce the values of a RefChunk in reverse order.
 * @remarks
 * ## Why
 *
 * Makes reduce right a live projection of the chunk; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The reduce right view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const reduceRight: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<B, E, R>;
  <A, E, R, B>(
    ref: RefChunk<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduceRight<
  A,
  E,
  R,
  B,
>(ref: RefChunk<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
  return RefSubject.map(ref, Chunk.reduceRight(b, f));
});

/**
 * Check if any value satisfies a predicate.
 * @remarks
 * ## Why
 *
 * Makes some a live projection of the chunk; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The some view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const some: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function some<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Chunk.some(predicate));
});

/**
 * Check if all values satisfy a predicate.
 * @remarks
 * ## Why
 *
 * Makes every a live projection of the chunk; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The every view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const every: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function every<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Chunk.every(predicate));
});

/**
 * Check if a RefChunk contains a value.
 * @remarks
 * ## Why
 *
 * Makes contains a live projection of the chunk; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The contains view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const contains: {
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): RefSubject.Computed<boolean, E, R>;
} = dual(2, function contains<A, E, R>(ref: RefChunk<A, E, R>, value: A) {
  return RefSubject.map(ref, Chunk.contains(value));
});

// ========================================
// Filtered
// ========================================

/**
 * Get a value at a particular index of a RefChunk.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get index as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get index view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const getIndex: {
  (index: number): <A, E, R>(ref: RefChunk<A, E, R>) => RefSubject.Filtered<A, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, index: number): RefSubject.Filtered<A, E, R>;
} = dual(2, function getIndex<A, E, R>(ref: RefChunk<A, E, R>, index: number) {
  return RefSubject.filterMap(ref, Chunk.get(index));
});

/**
 * Get the first element of a RefChunk as a Filtered.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of head as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The head view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const head = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, Chunk.head);

/**
 * Get the last element of a RefChunk as a Filtered.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of last as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The last view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const last = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, Chunk.last);

/**
 * Find the first value satisfying a predicate.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of find first as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The find first view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const findFirst: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Filtered<A, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean): RefSubject.Filtered<A, E, R>;
} = dual(2, function findFirst<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.filterMap(ref, Chunk.findFirst(predicate));
});

/**
 * Find the last value satisfying a predicate.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of find last as Filtered state, so absence stays explicit
 * while later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The find last view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const findLast: {
  <A>(predicate: (a: A) => boolean): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Filtered<A, E, R>;
  <A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean): RefSubject.Filtered<A, E, R>;
} = dual(2, function findLast<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.filterMap(ref, Chunk.findLast(predicate));
});
