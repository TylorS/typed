/**
 * Extensions to RefSubject for working with HashMap values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as HashMap from "effect/HashMap";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";
import { Result } from "effect";

/**
 * A RefHashMap is a RefSubject specialized over a HashMap.
 * @remarks
 * ## Why
 *
 * Defines hash map state with the same current-read, pushed-update, and synchronized-write
 * contract as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefHashMap is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefHashMap<
  in out K,
  in out V,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<HashMap.HashMap<K, V>, E, R> {}

/**
 * Creates a new `RefHashMap` from a HashMap, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates hash map state with equality suited to that Effect data type, so unchanged values do not
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
export function make<K, V, E = never, R = never>(
  initial:
    | HashMap.HashMap<K, V>
    | Effect.Effect<HashMap.HashMap<K, V>, E, R>
    | Fx.Fx<HashMap.HashMap<K, V>, E, R>,
): Effect.Effect<RefHashMap<K, V, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

// ========================================
// Combinators
// ========================================

/**
 * Set a key-value pair in the RefHashMap.
 * @remarks
 * ## Why
 *
 * Keeps set atomic with respect to competing RefSubject writes instead of splitting the read and
 * replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set performs one serialized hash map transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const set: {
  <K, V>(
    key: K,
    value: V,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    key: K,
    value: V,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(3, function set<K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K, value: V) {
  return RefSubject.update(ref, HashMap.set(key, value));
});

/**
 * Remove a key from the RefHashMap.
 * @remarks
 * ## Why
 *
 * Applies remove to the committed hash map value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove performs one serialized hash map transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const remove: {
  <K>(key: K): <V, E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function remove<K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K) {
  return RefSubject.update(ref, HashMap.remove(key));
});

/**
 * Modify the value at a key if it exists.
 * @remarks
 * ## Why
 *
 * Keeps modify atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running modify performs one serialized hash map transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const modify: {
  <K, V>(
    key: K,
    f: (v: V) => V,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    key: K,
    f: (v: V) => V,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(3, function modify<K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K, f: (v: V) => V) {
  return RefSubject.update(ref, HashMap.modify(key, f));
});

/**
 * Modify the value at a key using an Option-based update function.
 * @remarks
 * ## Why
 *
 * Keeps modify at atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running modify at performs one serialized hash map transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const modifyAt: {
  <K, V>(
    key: K,
    f: HashMap.HashMap.UpdateFn<V>,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    key: K,
    f: HashMap.HashMap.UpdateFn<V>,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(3, function modifyAt<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, key: K, f: HashMap.HashMap.UpdateFn<V>) {
  return RefSubject.update(ref, HashMap.modifyAt(key, f));
});

/**
 * Set multiple key-value pairs in the RefHashMap.
 * @remarks
 * ## Why
 *
 * Keeps set many atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set many performs one serialized hash map transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const setMany: {
  <K, V>(
    entries: Iterable<readonly [K, V]>,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    entries: Iterable<readonly [K, V]>,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function setMany<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, entries: Iterable<readonly [K, V]>) {
  return RefSubject.update(ref, HashMap.setMany(entries));
});

/**
 * Remove multiple keys from the RefHashMap.
 * @remarks
 * ## Why
 *
 * Applies remove many to the committed hash map value and publishes only the result, preserving
 * its element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove many performs one serialized hash map transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const removeMany: {
  <K>(
    keys: Iterable<K>,
  ): <V, E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    keys: Iterable<K>,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function removeMany<K, V, E, R>(ref: RefHashMap<K, V, E, R>, keys: Iterable<K>) {
  return RefSubject.update(ref, HashMap.removeMany(keys));
});

/**
 * Clear all entries from the RefHashMap.
 * @remarks
 * ## Why
 *
 * Applies clear to the committed hash map value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running clear performs one serialized hash map transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const clear = <K, V, E, R>(
  ref: RefHashMap<K, V, E, R>,
): Effect.Effect<HashMap.HashMap<K, V>, E, R> => RefSubject.update(ref, () => HashMap.empty());

/**
 * Merge another HashMap into this one.
 * @remarks
 * ## Why
 *
 * Combines bulk hash map changes in one committed value, giving subscribers one coherent update
 * rather than a partially applied sequence.
 *
 * ## Ownership and lifetime
 *
 * Running union performs one serialized hash map transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const union: {
  <K, V>(
    that: HashMap.HashMap<K, V>,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    that: HashMap.HashMap<K, V>,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function union<K, V, E, R>(ref: RefHashMap<K, V, E, R>, that: HashMap.HashMap<K, V>) {
  return RefSubject.update(ref, HashMap.union(that));
});

/**
 * Filter entries in place.
 * @remarks
 * ## Why
 *
 * Applies filter to the committed HashMap through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed HashMap and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filter: {
  <K, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function filter<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.update(ref, HashMap.filter(predicate));
});

/**
 * Map values in place (endomorphic).
 * @remarks
 * ## Why
 *
 * Applies map to the committed HashMap through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed HashMap and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <K, V>(
    f: (value: V, key: K) => V,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    f: (value: V, key: K) => V,
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function map<K, V, E, R>(ref: RefHashMap<K, V, E, R>, f: (value: V, key: K) => V) {
  return RefSubject.update(ref, HashMap.map(f));
});

// ========================================
// Computed
// ========================================

/**
 * Get the current size of the RefHashMap.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the hash map; consumers can sample it now or observe it without
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
export const size = <K, V, E, R>(ref: RefHashMap<K, V, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, HashMap.size);

/**
 * Check if the RefHashMap is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the hash map; consumers can sample it now or observe it
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
export const isEmpty = <K, V, E, R>(
  ref: RefHashMap<K, V, E, R>,
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, HashMap.isEmpty);

/**
 * Check if the RefHashMap is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the hash map; consumers can sample it now or observe it
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
export const isNonEmpty = <K, V, E, R>(
  ref: RefHashMap<K, V, E, R>,
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, (m) => !HashMap.isEmpty(m));

/**
 * Get all keys from the RefHashMap.
 * @remarks
 * ## Why
 *
 * Projects hash map state with keys for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The keys view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const keys = <K, V, E, R>(
  ref: RefHashMap<K, V, E, R>,
): RefSubject.Computed<Array<K>, E, R> => RefSubject.map(ref, (m) => Array.from(HashMap.keys(m)));

/**
 * Get all values from the RefHashMap.
 * @remarks
 * ## Why
 *
 * Projects hash map state with values for both current reads and future pushes, avoiding a second
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
export const values = <K, V, E, R>(
  ref: RefHashMap<K, V, E, R>,
): RefSubject.Computed<Array<V>, E, R> => RefSubject.map(ref, HashMap.toValues);

/**
 * Get all entries from the RefHashMap.
 * @remarks
 * ## Why
 *
 * Projects hash map state with entries for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The entries view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const entries = <K, V, E, R>(
  ref: RefHashMap<K, V, E, R>,
): RefSubject.Computed<Array<[K, V]>, E, R> => RefSubject.map(ref, HashMap.toEntries);

/**
 * Check if a key exists in the RefHashMap.
 * @remarks
 * ## Why
 *
 * Makes has a live projection of the hash map; consumers can sample it now or observe it without
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
  <K>(key: K): <V, E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K): RefSubject.Computed<boolean, E, R>;
} = dual(2, function has<K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K) {
  return RefSubject.map(ref, HashMap.has(key));
});

/**
 * Map values to a different type.
 * @remarks
 * ## Why
 *
 * Projects hash map state with map values for both current reads and future pushes, avoiding a
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
  <K, V, B>(
    f: (value: V, key: K) => B,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<HashMap.HashMap<K, B>, E, R>;
  <K, V, E, R, B>(
    ref: RefHashMap<K, V, E, R>,
    f: (value: V, key: K) => B,
  ): RefSubject.Computed<HashMap.HashMap<K, B>, E, R>;
} = dual(2, function mapValues<
  K,
  V,
  E,
  R,
  B,
>(ref: RefHashMap<K, V, E, R>, f: (value: V, key: K) => B) {
  return RefSubject.map(ref, HashMap.map(f));
});

/**
 * Filter entries creating a Computed value.
 * @remarks
 * ## Why
 *
 * Projects hash map state with filter values for both current reads and future pushes, avoiding a
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
  <K, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<HashMap.HashMap<K, V>, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<HashMap.HashMap<K, V>, E, R>;
} = dual(2, function filterValues<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(ref, HashMap.filter(predicate));
});

/**
 * Filter and map values.
 * @remarks
 * ## Why
 *
 * Projects hash map state with filter map values for both current reads and future pushes,
 * avoiding a second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The filter map values view retains no independent state. An Effect read samples the source once;
 * Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const filterMapValues: {
  <K, V, B>(
    f: (value: V, key: K) => Option.Option<B>,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<HashMap.HashMap<K, B>, E, R>;
  <K, V, E, R, B>(
    ref: RefHashMap<K, V, E, R>,
    f: (value: V, key: K) => Option.Option<B>,
  ): RefSubject.Computed<HashMap.HashMap<K, B>, E, R>;
} = dual(2, function filterMapValues<
  K,
  V,
  E,
  R,
  B,
>(ref: RefHashMap<K, V, E, R>, f: (value: V, key: K) => Option.Option<B>) {
  return RefSubject.map(
    ref,
    HashMap.filterMap((value, key) =>
      Option.match(f(value, key), {
        onNone: () => Result.failVoid,
        onSome: (b) => Result.succeed(b),
      }),
    ),
  );
});

/**
 * Reduce the entries to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the hash map; consumers can sample it now or observe it
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
  <K, V, B>(
    b: B,
    f: (b: B, value: V, key: K) => B,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<B, E, R>;
  <K, V, E, R, B>(
    ref: RefHashMap<K, V, E, R>,
    b: B,
    f: (b: B, value: V, key: K) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<
  K,
  V,
  E,
  R,
  B,
>(ref: RefHashMap<K, V, E, R>, b: B, f: (b: B, value: V, key: K) => B) {
  return RefSubject.map(ref, HashMap.reduce(b, f));
});

/**
 * Check if any entry satisfies a predicate.
 * @remarks
 * ## Why
 *
 * Makes some a live projection of the hash map; consumers can sample it now or observe it without
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
  <K, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function some<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(ref, HashMap.some(predicate));
});

/**
 * Check if all entries satisfy a predicate.
 * @remarks
 * ## Why
 *
 * Makes every a live projection of the hash map; consumers can sample it now or observe it without
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
  <K, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function every<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(ref, HashMap.every(predicate));
});

// ========================================
// Filtered
// ========================================

/**
 * Get the value at a key as a Filtered.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of get as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The get view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const get: {
  <K>(key: K): <V, E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Filtered<V, E, R>;
  <K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K): RefSubject.Filtered<V, E, R>;
} = dual(2, function get<K, V, E, R>(ref: RefHashMap<K, V, E, R>, key: K) {
  return RefSubject.filterMap(ref, HashMap.get(key));
});

/**
 * Find the first entry satisfying a predicate.
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
  <K, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefHashMap<K, V, E, R>) => RefSubject.Filtered<[K, V], E, R>;
  <K, V, E, R>(
    ref: RefHashMap<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Filtered<[K, V], E, R>;
} = dual(2, function findFirst<
  K,
  V,
  E,
  R,
>(ref: RefHashMap<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.filterMap(ref, (g) => HashMap.findFirst(g, predicate));
});
