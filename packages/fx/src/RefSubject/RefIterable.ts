/**
 * Extensions to RefSubject for working with Iterable values
 * @since 1.18.0
 */

import { Result } from "effect";
import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as Iterable from "effect/Iterable";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefIterable is a RefSubject specialized over an Iterable of values.
 * @remarks
 * ## Why
 *
 * Defines iterable state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefIterable is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefIterable<
  in out A,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<Iterable<A>, E, R> {}

/**
 * Creates a new `RefIterable` from an Iterable, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates iterable state with equality suited to that Effect data type, so unchanged values do not
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
  initial: Iterable<A> | Effect.Effect<Iterable<A>, E, R> | Fx.Fx<Iterable<A>, E, R>,
): Effect.Effect<RefIterable<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

// ========================================
// Combinators
// ========================================

/**
 * Prepend a value to the current state of a RefIterable.
 * @remarks
 * ## Why
 *
 * Expresses prepend as one ordered iterable transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running prepend performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const prepend: {
  <A>(value: A): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, value: A): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function prepend<A, E, R>(ref: RefIterable<A, E, R>, value: A) {
  return RefSubject.update(ref, Iterable.prepend(value));
});

/**
 * Prepend an iterable of values to the current state of a RefIterable.
 * @remarks
 * ## Why
 *
 * Expresses prepend all as one ordered iterable transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running prepend all performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, value: Iterable<A>): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function prependAll<A, E, R>(ref: RefIterable<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, Iterable.prependAll(value));
});

/**
 * Append a value to the current state of a RefIterable.
 * @remarks
 * ## Why
 *
 * Expresses append as one ordered iterable transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running append performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const append: {
  <A>(value: A): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, value: A): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function append<A, E, R>(ref: RefIterable<A, E, R>, value: A) {
  return RefSubject.update(ref, Iterable.append(value));
});

/**
 * Append an iterable of values to the current state of a RefIterable.
 * @remarks
 * ## Why
 *
 * Expresses append all as one ordered iterable transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running append all performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const appendAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, value: Iterable<A>): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function appendAll<A, E, R>(ref: RefIterable<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, Iterable.appendAll(value));
});

/**
 * Drop the first `n` values from a RefIterable.
 * @remarks
 * ## Why
 *
 * Applies drop to the committed iterable value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running drop performs one serialized iterable transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const drop: {
  (n: number): <A, E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, n: number): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function drop<A, E, R>(ref: RefIterable<A, E, R>, n: number) {
  return RefSubject.update(ref, Iterable.drop(n));
});

/**
 * Take the first `n` values from a RefIterable.
 * @remarks
 * ## Why
 *
 * Applies take to the committed iterable value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take performs one serialized iterable transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const take: {
  (n: number): <A, E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, n: number): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function take<A, E, R>(ref: RefIterable<A, E, R>, n: number) {
  return RefSubject.update(ref, Iterable.take(n));
});

/**
 * Take values from a RefIterable while a predicate is true.
 * @remarks
 * ## Why
 *
 * Applies take while to the committed iterable value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running take while performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    predicate: (a: A) => boolean,
  ): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function takeWhile<A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.update(ref, Iterable.takeWhile(predicate));
});

/**
 * Filter the values of a RefIterable (mutating).
 * @remarks
 * ## Why
 *
 * Applies filter to the committed Iterable through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed Iterable and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filter: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    predicate: (a: A) => boolean,
  ): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function filter<A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.update(ref, Iterable.filter(predicate));
});

/**
 * Map (Endomorphic) the values of a RefIterable.
 * @remarks
 * ## Why
 *
 * Applies map to the committed Iterable through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed Iterable and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A,
  ): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    f: (a: A, index: number) => A,
  ): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function map<A, E, R>(ref: RefIterable<A, E, R>, f: (a: A, index: number) => A) {
  return RefSubject.update(ref, Iterable.map(f));
});

/**
 * Remove adjacent duplicate values from a RefIterable.
 * @remarks
 * ## Why
 *
 * Derives the reordered iterable through its Effect collection operation while retaining
 * RefSubject equality and version tracking.
 *
 * ## Ownership and lifetime
 *
 * Running dedupe adjacent performs one serialized iterable transition and resolves with its
 * committed value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const dedupeAdjacent = <A, E, R>(
  ref: RefIterable<A, E, R>,
): Effect.Effect<Iterable<A>, E, R> => RefSubject.update(ref, Iterable.dedupeAdjacent);

/**
 * Intersperse a separator between elements.
 * @remarks
 * ## Why
 *
 * Intersperse a separator between elements. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running intersperse performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const intersperse: {
  <A>(middle: A): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, middle: A): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function intersperse<A, E, R>(ref: RefIterable<A, E, R>, middle: A) {
  return RefSubject.update(ref, Iterable.intersperse(middle));
});

/**
 * Repeat the iterable n times.
 * @remarks
 * ## Why
 *
 * Repeat the iterable n times. The operation remains attached to the RefSubject's versioned state
 * boundary.
 *
 * ## Ownership and lifetime
 *
 * Running repeat performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const repeat: {
  (n: number): <A, E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, n: number): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function repeat<A, E, R>(ref: RefIterable<A, E, R>, n: number) {
  return RefSubject.update(ref, Iterable.repeat(n));
});

/**
 * FlatMap (endomorphic).
 * @remarks
 * ## Why
 *
 * FlatMap (endomorphic). The operation remains attached to the RefSubject's versioned state
 * boundary.
 *
 * ## Ownership and lifetime
 *
 * Running flat map performs one serialized iterable transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const flatMap: {
  <A>(
    f: (a: A, index: number) => Iterable<A>,
  ): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    f: (a: A, index: number) => Iterable<A>,
  ): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function flatMap<
  A,
  E,
  R,
>(ref: RefIterable<A, E, R>, f: (a: A, index: number) => Iterable<A>) {
  return RefSubject.update(ref, Iterable.flatMap(f));
});

/**
 * Filter and map values in place.
 * @remarks
 * ## Why
 *
 * Applies `filterMap` to the committed Iterable through `RefSubject.update` and publishes one
 * coherent replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed Iterable and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filterMap: {
  <A>(
    f: (a: A, index: number) => Option.Option<A>,
  ): <E, R>(ref: RefIterable<A, E, R>) => Effect.Effect<Iterable<A>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    f: (a: A, index: number) => Option.Option<A>,
  ): Effect.Effect<Iterable<A>, E, R>;
} = dual(2, function filterMap<
  A,
  E,
  R,
>(ref: RefIterable<A, E, R>, f: (a: A, index: number) => Option.Option<A>) {
  return RefSubject.update(
    ref,
    Iterable.filterMap((a, index) =>
      Option.match(f(a, index), {
        onNone: () => Result.failVoid,
        onSome: (b) => Result.succeed(b),
      }),
    ),
  );
});

/**
 * Extract Some values from Option iterable.
 * @remarks
 * ## Why
 *
 * Applies `getSomes` to the committed Iterable through `RefSubject.update` and publishes one
 * coherent replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed Iterable and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const getSomes = <A, E, R>(
  ref: RefIterable<Option.Option<A>, E, R>,
): Effect.Effect<Iterable<Option.Option<A>>, E, R> =>
  RefSubject.update(ref, (iter) => Iterable.getSomes(iter) as Iterable<Option.Option<A>>);

// ========================================
// Computed
// ========================================

/**
 * Check if a RefIterable is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the iterable; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The is empty view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isEmpty = <A, E, R>(ref: RefIterable<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Iterable.isEmpty);

/**
 * Get the current size of a RefIterable.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the iterable; consumers can sample it now or observe it without
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
export const size = <A, E, R>(ref: RefIterable<A, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Iterable.size);

/**
 * Map the values of a RefIterable to a different type.
 * @remarks
 * ## Why
 *
 * Projects iterable state with map values for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
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
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<Iterable<B>, E, R>;
  <A, E, R, B>(
    ref: RefIterable<A, E, R>,
    f: (a: A, index: number) => B,
  ): RefSubject.Computed<Iterable<B>, E, R>;
} = dual(2, function mapValues<
  A,
  E,
  R,
  B,
>(ref: RefIterable<A, E, R>, f: (a: A, index: number) => B) {
  return RefSubject.map(ref, Iterable.map(f));
});

/**
 * Filter the values of a RefIterable creating a Computed value.
 * @remarks
 * ## Why
 *
 * Projects iterable state with filter values for both current reads and future pushes, avoiding a
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
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<Iterable<A>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<Iterable<A>, E, R>;
} = dual(2, function filterValues<
  A,
  E,
  R,
>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Iterable.filter(predicate));
});

/**
 * Group the values of a RefIterable by a key.
 * @remarks
 * ## Why
 *
 * Projects iterable state with group by for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The group by view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const groupBy: {
  <A>(
    f: (a: A) => string,
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<Record<string, Array<A>>, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    f: (a: A) => string,
  ): RefSubject.Computed<Record<string, Array<A>>, E, R>;
} = dual(2, function groupBy<A, E, R>(ref: RefIterable<A, E, R>, f: (a: A) => string) {
  return RefSubject.map(ref, Iterable.groupBy(f));
});

/**
 * Reduce the values of a RefIterable to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the iterable; consumers can sample it now or observe it
 * without copying the source state.
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
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<B, E, R>;
  <A, E, R, B>(
    ref: RefIterable<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<
  A,
  E,
  R,
  B,
>(ref: RefIterable<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
  return RefSubject.map(ref, Iterable.reduce(b, f));
});

/**
 * Check if any value satisfies a predicate.
 * @remarks
 * ## Why
 *
 * Makes some a live projection of the iterable; consumers can sample it now or observe it without
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
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function some<A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Iterable.some(predicate));
});

/**
 * Check if a RefIterable contains a value.
 * @remarks
 * ## Why
 *
 * Makes contains a live projection of the iterable; consumers can sample it now or observe it
 * without copying the source state.
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
  <A>(value: A): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<boolean, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, value: A): RefSubject.Computed<boolean, E, R>;
} = dual(2, function contains<A, E, R>(ref: RefIterable<A, E, R>, value: A) {
  return RefSubject.map(ref, Iterable.contains(value));
});

/**
 * Count elements satisfying a predicate.
 * @remarks
 * ## Why
 *
 * Makes count by a live projection of the iterable; consumers can sample it now or observe it
 * without copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The count by view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const countBy: {
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Computed<number, E, R>;
  <A, E, R>(
    ref: RefIterable<A, E, R>,
    predicate: (a: A) => boolean,
  ): RefSubject.Computed<number, E, R>;
} = dual(2, function countBy<A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Iterable.countBy(predicate));
});

/**
 * Convert to array.
 * @remarks
 * ## Why
 *
 * Projects iterable state with to array for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The to array view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const toArray = <A, E, R>(ref: RefIterable<A, E, R>): RefSubject.Computed<Array<A>, E, R> =>
  RefSubject.map(ref, (iter) => Array.from(iter));

// ========================================
// Filtered
// ========================================

/**
 * Get the first element of a RefIterable as a Filtered.
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
export const head = <A, E, R>(ref: RefIterable<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, Iterable.head);

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
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Filtered<A, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean): RefSubject.Filtered<A, E, R>;
} = dual(2, function findFirst<A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.filterMap(ref, Iterable.findFirst(predicate));
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
  <A>(
    predicate: (a: A) => boolean,
  ): <E, R>(ref: RefIterable<A, E, R>) => RefSubject.Filtered<A, E, R>;
  <A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean): RefSubject.Filtered<A, E, R>;
} = dual(2, function findLast<A, E, R>(ref: RefIterable<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.filterMap(ref, Iterable.findLast(predicate));
});
