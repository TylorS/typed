/**
 * Extensions to RefSubject for working with HashSet values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as HashSet from "effect/HashSet";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefHashSet is a RefSubject specialized over a HashSet.
 * @remarks
 * ## Why
 *
 * Defines hash set state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefHashSet is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefHashSet<
  in out V,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<HashSet.HashSet<V>, E, R> {}

/**
 * Creates a new `RefHashSet` from a HashSet, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates hash set state with equality suited to that Effect data type, so unchanged values do not
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
export function make<V, E = never, R = never>(
  initial:
    | HashSet.HashSet<V>
    | Effect.Effect<HashSet.HashSet<V>, E, R>
    | Fx.Fx<HashSet.HashSet<V>, E, R>,
): Effect.Effect<RefHashSet<V, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

// ========================================
// Combinators
// ========================================

/**
 * Add a value to the RefHashSet.
 * @remarks
 * ## Why
 *
 * Add a value to the RefHashSet. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running add performs one serialized hash set transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const add: {
  <V>(value: V): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(ref: RefHashSet<V, E, R>, value: V): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function add<V, E, R>(ref: RefHashSet<V, E, R>, value: V) {
  return RefSubject.update(ref, HashSet.add(value));
});

/**
 * Remove a value from the RefHashSet.
 * @remarks
 * ## Why
 *
 * Applies remove to the committed hash set value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove performs one serialized hash set transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const remove: {
  <V>(value: V): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(ref: RefHashSet<V, E, R>, value: V): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function remove<V, E, R>(ref: RefHashSet<V, E, R>, value: V) {
  return RefSubject.update(ref, HashSet.remove(value));
});

/**
 * Clear all values from the RefHashSet.
 * @remarks
 * ## Why
 *
 * Applies clear to the committed hash set value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running clear performs one serialized hash set transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const clear = <V, E, R>(ref: RefHashSet<V, E, R>): Effect.Effect<HashSet.HashSet<V>, E, R> =>
  RefSubject.update(ref, () => HashSet.empty());

/**
 * Compute the union with another HashSet.
 * @remarks
 * ## Why
 *
 * Combines bulk hash set changes in one committed value, giving subscribers one coherent update
 * rather than a partially applied sequence.
 *
 * ## Ownership and lifetime
 *
 * Running union performs one serialized hash set transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const union: {
  <V>(
    that: HashSet.HashSet<V>,
  ): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    that: HashSet.HashSet<V>,
  ): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function union<V, E, R>(ref: RefHashSet<V, E, R>, that: HashSet.HashSet<V>) {
  return RefSubject.update(ref, HashSet.union(that));
});

/**
 * Compute the intersection with another HashSet.
 * @remarks
 * ## Why
 *
 * Compute the intersection with another HashSet. The operation remains attached to the
 * RefSubject's versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running intersection performs one serialized hash set transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const intersection: {
  <V>(
    that: HashSet.HashSet<V>,
  ): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    that: HashSet.HashSet<V>,
  ): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function intersection<V, E, R>(ref: RefHashSet<V, E, R>, that: HashSet.HashSet<V>) {
  return RefSubject.update(ref, HashSet.intersection(that));
});

/**
 * Compute the difference with another HashSet.
 * @remarks
 * ## Why
 *
 * Compute the difference with another HashSet. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running difference performs one serialized hash set transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const difference: {
  <V>(
    that: HashSet.HashSet<V>,
  ): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    that: HashSet.HashSet<V>,
  ): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function difference<V, E, R>(ref: RefHashSet<V, E, R>, that: HashSet.HashSet<V>) {
  return RefSubject.update(ref, HashSet.difference(that));
});

/**
 * Filter values in place.
 * @remarks
 * ## Why
 *
 * Applies filter to the committed HashSet through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed HashSet and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filter: {
  <V>(
    predicate: (value: V) => boolean,
  ): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    predicate: (value: V) => boolean,
  ): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function filter<V, E, R>(ref: RefHashSet<V, E, R>, predicate: (value: V) => boolean) {
  return RefSubject.update(ref, HashSet.filter(predicate));
});

/**
 * Map values in place (endomorphic).
 * @remarks
 * ## Why
 *
 * Applies map to the committed HashSet through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed HashSet and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <V>(
    f: (value: V) => V,
  ): <E, R>(ref: RefHashSet<V, E, R>) => Effect.Effect<HashSet.HashSet<V>, E, R>;
  <V, E, R>(ref: RefHashSet<V, E, R>, f: (value: V) => V): Effect.Effect<HashSet.HashSet<V>, E, R>;
} = dual(2, function map<V, E, R>(ref: RefHashSet<V, E, R>, f: (value: V) => V) {
  return RefSubject.update(ref, HashSet.map(f));
});

// ========================================
// Computed
// ========================================

/**
 * Get the current size of the RefHashSet.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the hash set; consumers can sample it now or observe it without
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
export const size = <V, E, R>(ref: RefHashSet<V, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, HashSet.size);

/**
 * Check if the RefHashSet is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the hash set; consumers can sample it now or observe it
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
export const isEmpty = <V, E, R>(ref: RefHashSet<V, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, HashSet.isEmpty);

/**
 * Check if the RefHashSet is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the hash set; consumers can sample it now or observe it
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
export const isNonEmpty = <V, E, R>(ref: RefHashSet<V, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (s) => !HashSet.isEmpty(s));

/**
 * Check if a value exists in the RefHashSet.
 * @remarks
 * ## Why
 *
 * Makes has a live projection of the hash set; consumers can sample it now or observe it without
 * copying the source state.
 *
 * ## Ownership and lifetime
 *
 * The has view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const has: {
  <V>(value: V): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <V, E, R>(ref: RefHashSet<V, E, R>, value: V): RefSubject.Computed<boolean, E, R>;
} = dual(2, function has<V, E, R>(ref: RefHashSet<V, E, R>, value: V) {
  return RefSubject.map(ref, HashSet.has(value));
});

/**
 * Check if any value satisfies a predicate.
 * @remarks
 * ## Why
 *
 * Makes some a live projection of the hash set; consumers can sample it now or observe it without
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
  <V>(
    predicate: (value: V) => boolean,
  ): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    predicate: (value: V) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function some<V, E, R>(ref: RefHashSet<V, E, R>, predicate: (value: V) => boolean) {
  return RefSubject.map(ref, HashSet.some(predicate));
});

/**
 * Check if all values satisfy a predicate.
 * @remarks
 * ## Why
 *
 * Makes every a live projection of the hash set; consumers can sample it now or observe it without
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
  <V>(
    predicate: (value: V) => boolean,
  ): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    predicate: (value: V) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function every<V, E, R>(ref: RefHashSet<V, E, R>, predicate: (value: V) => boolean) {
  return RefSubject.map(ref, HashSet.every(predicate));
});

/**
 * Check if this set is a subset of another.
 * @remarks
 * ## Why
 *
 * Check if this set is a subset of another. The operation remains attached to the RefSubject's
 * versioned state boundary.
 *
 * ## Ownership and lifetime
 *
 * The is subset view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State predicates
 */
export const isSubset: {
  <V>(
    that: HashSet.HashSet<V>,
  ): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <V, E, R>(ref: RefHashSet<V, E, R>, that: HashSet.HashSet<V>): RefSubject.Computed<boolean, E, R>;
} = dual(2, function isSubset<V, E, R>(ref: RefHashSet<V, E, R>, that: HashSet.HashSet<V>) {
  return RefSubject.map(ref, HashSet.isSubset(that));
});

/**
 * Map values to a different type.
 * @remarks
 * ## Why
 *
 * Projects hash set state with map values for both current reads and future pushes, avoiding a
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
  <V, B>(
    f: (value: V) => B,
  ): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<HashSet.HashSet<B>, E, R>;
  <V, E, R, B>(
    ref: RefHashSet<V, E, R>,
    f: (value: V) => B,
  ): RefSubject.Computed<HashSet.HashSet<B>, E, R>;
} = dual(2, function mapValues<V, E, R, B>(ref: RefHashSet<V, E, R>, f: (value: V) => B) {
  return RefSubject.map(ref, HashSet.map(f));
});

/**
 * Filter values creating a Computed value.
 * @remarks
 * ## Why
 *
 * Projects hash set state with filter values for both current reads and future pushes, avoiding a
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
  <V>(
    predicate: (value: V) => boolean,
  ): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<HashSet.HashSet<V>, E, R>;
  <V, E, R>(
    ref: RefHashSet<V, E, R>,
    predicate: (value: V) => boolean,
  ): RefSubject.Computed<HashSet.HashSet<V>, E, R>;
} = dual(2, function filterValues<
  V,
  E,
  R,
>(ref: RefHashSet<V, E, R>, predicate: (value: V) => boolean) {
  return RefSubject.map(ref, HashSet.filter(predicate));
});

/**
 * Reduce the values to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the hash set; consumers can sample it now or observe it
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
  <V, B>(
    b: B,
    f: (b: B, value: V) => B,
  ): <E, R>(ref: RefHashSet<V, E, R>) => RefSubject.Computed<B, E, R>;
  <V, E, R, B>(
    ref: RefHashSet<V, E, R>,
    b: B,
    f: (b: B, value: V) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<V, E, R, B>(ref: RefHashSet<V, E, R>, b: B, f: (b: B, value: V) => B) {
  return RefSubject.map(ref, HashSet.reduce(b, f));
});

/**
 * Get all values as an array.
 * @remarks
 * ## Why
 *
 * Projects hash set state with values for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The values view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const values = <V, E, R>(ref: RefHashSet<V, E, R>): RefSubject.Computed<Array<V>, E, R> =>
  RefSubject.map(ref, (s) => Array.from(s));
