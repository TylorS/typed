/**
 * Extensions to RefSubject for working with Trie values
 * @since 1.18.0
 */

import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import type * as Scope from "effect/Scope";
import * as Trie from "effect/Trie";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";
import { Result } from "effect";

/**
 * A RefTrie is a RefSubject specialized over a Trie.
 * @remarks
 * ## Why
 *
 * Defines trie state with the same current-read, pushed-update, and synchronized-write contract as
 * RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefTrie is a contract and performs no acquisition. Implementations retain the errors, services,
 * interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefTrie<in out V, in out E = never, out R = never> extends RefSubject.RefSubject<
  Trie.Trie<V>,
  E,
  R
> {}

/**
 * Creates a new `RefTrie` from a Trie, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates trie state with equality suited to that Effect data type, so unchanged values do not
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
  initial: Trie.Trie<V> | Effect.Effect<Trie.Trie<V>, E, R> | Fx.Fx<Trie.Trie<V>, E, R>,
): Effect.Effect<RefTrie<V, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

// ========================================
// Combinators
// ========================================

/**
 * Insert a key-value pair into the Trie.
 * @remarks
 * ## Why
 *
 * Expresses insert as one ordered trie transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running insert performs one serialized trie transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const insert: {
  <V>(key: string, value: V): <E, R>(ref: RefTrie<V, E, R>) => Effect.Effect<Trie.Trie<V>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, key: string, value: V): Effect.Effect<Trie.Trie<V>, E, R>;
} = dual(3, function insert<V, E, R>(ref: RefTrie<V, E, R>, key: string, value: V) {
  return RefSubject.update(ref, Trie.insert(key, value));
});

/**
 * Insert multiple key-value pairs into the Trie.
 * @remarks
 * ## Why
 *
 * Expresses insert many as one ordered trie transition; readers never observe the intermediate
 * collection used to build the result.
 *
 * ## Ownership and lifetime
 *
 * Running insert many performs one serialized trie transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const insertMany: {
  <V>(
    entries: Iterable<[string, V]>,
  ): <E, R>(ref: RefTrie<V, E, R>) => Effect.Effect<Trie.Trie<V>, E, R>;
  <V, E, R>(
    ref: RefTrie<V, E, R>,
    entries: Iterable<[string, V]>,
  ): Effect.Effect<Trie.Trie<V>, E, R>;
} = dual(2, function insertMany<V, E, R>(ref: RefTrie<V, E, R>, entries: Iterable<[string, V]>) {
  return RefSubject.update(ref, Trie.insertMany(entries));
});

/**
 * Remove a key from the Trie.
 * @remarks
 * ## Why
 *
 * Applies remove to the committed trie value and publishes only the result, preserving its element
 * order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove performs one serialized trie transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const remove: {
  (key: string): <V, E, R>(ref: RefTrie<V, E, R>) => Effect.Effect<Trie.Trie<V>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, key: string): Effect.Effect<Trie.Trie<V>, E, R>;
} = dual(2, function remove<V, E, R>(ref: RefTrie<V, E, R>, key: string) {
  return RefSubject.update(ref, Trie.remove(key));
});

/**
 * Remove multiple keys from the Trie.
 * @remarks
 * ## Why
 *
 * Applies remove many to the committed trie value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove many performs one serialized trie transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const removeMany: {
  (keys: Iterable<string>): <V, E, R>(ref: RefTrie<V, E, R>) => Effect.Effect<Trie.Trie<V>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, keys: Iterable<string>): Effect.Effect<Trie.Trie<V>, E, R>;
} = dual(2, function removeMany<V, E, R>(ref: RefTrie<V, E, R>, keys: Iterable<string>) {
  return RefSubject.update(ref, Trie.removeMany(keys));
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
 * Running modify performs one serialized trie transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const modify: {
  <V>(
    key: string,
    f: (v: V) => V,
  ): <E, R>(ref: RefTrie<V, E, R>) => Effect.Effect<Trie.Trie<V>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, key: string, f: (v: V) => V): Effect.Effect<Trie.Trie<V>, E, R>;
} = dual(3, function modify<V, E, R>(ref: RefTrie<V, E, R>, key: string, f: (v: V) => V) {
  return RefSubject.update(ref, Trie.modify(key, f));
});

/**
 * Clear all entries from the Trie.
 * @remarks
 * ## Why
 *
 * Applies clear to the committed trie value and publishes only the result, preserving its element
 * order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running clear performs one serialized trie transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const clear = <V, E, R>(ref: RefTrie<V, E, R>): Effect.Effect<Trie.Trie<V>, E, R> =>
  RefSubject.update(ref, () => Trie.empty());

/**
 * Map values into a read-only derived trie.
 * @remarks
 * ## Why
 *
 * Creates a read-only Computed trie whose values are mapped for current reads and every later
 * source push; it does not modify the RefTrie.
 *
 * ## Ownership and lifetime
 *
 * The map view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <V>(
    f: (value: V, key: string) => V,
  ): <E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Trie.Trie<V>, E, R>;
  <V, E, R>(
    ref: RefTrie<V, E, R>,
    f: (value: V, key: string) => V,
  ): RefSubject.Computed<Trie.Trie<V>, E, R>;
} = dual(2, function map<V, E, R>(ref: RefTrie<V, E, R>, f: (value: V, key: string) => V) {
  return RefSubject.map(ref, Trie.map(f));
});

/**
 * Filter entries into a read-only derived trie.
 * @remarks
 * ## Why
 *
 * Creates a read-only Computed trie containing matching entries for current reads and every later
 * source push; it does not modify the RefTrie.
 *
 * ## Ownership and lifetime
 *
 * The filter view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State updates
 */
export const filter: {
  <V>(
    predicate: (value: V, key: string) => boolean,
  ): <E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Trie.Trie<V>, E, R>;
  <V, E, R>(
    ref: RefTrie<V, E, R>,
    predicate: (value: V, key: string) => boolean,
  ): RefSubject.Computed<Trie.Trie<V>, E, R>;
} = dual(2, function filter<
  V,
  E,
  R,
>(ref: RefTrie<V, E, R>, predicate: (value: V, key: string) => boolean) {
  return RefSubject.map(ref, Trie.filter(predicate));
});

/**
 * Filter and map entries into a read-only derived trie.
 * @remarks
 * ## Why
 *
 * Creates a read-only Computed trie that can transform or omit each entry; it leaves the writable
 * source trie unchanged.
 *
 * ## Ownership and lifetime
 *
 * The filter map view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category State updates
 */
export const filterMap: {
  <V>(
    f: (value: V, key: string) => Option.Option<V>,
  ): <E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Trie.Trie<V>, E, R>;
  <V, E, R>(
    ref: RefTrie<V, E, R>,
    f: (value: V, key: string) => Option.Option<V>,
  ): RefSubject.Computed<Trie.Trie<V>, E, R>;
} = dual(2, function filterMap<
  V,
  E,
  R,
>(ref: RefTrie<V, E, R>, f: (value: V, key: string) => Option.Option<V>) {
  return RefSubject.map(
    ref,
    Trie.filterMap((value, key) =>
      Option.match(f(value, key), {
        onNone: () => Result.failVoid,
        onSome: (b) => Result.succeed(b),
      }),
    ),
  );
});

// ========================================
// Computed
// ========================================

/**
 * Compact Option values.
 * @remarks
 * ## Why
 *
 * Creates a read-only Computed trie by removing None values and unwrapping Some values on each
 * source version; the result is never absent as a whole.
 *
 * ## Ownership and lifetime
 *
 * This declaration performs no acquisition and retains no resources. Implementations preserve
 * source errors, services, and lifetime.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const compact = <V, E, R>(ref: RefTrie<Option.Option<V>, E, R>) =>
  RefSubject.map(ref, Trie.compact);

/**
 * Get the current size of the Trie.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the trie; consumers can sample it now or observe it without
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
export const size = <V, E, R>(ref: RefTrie<V, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Trie.size);

/**
 * Check if the Trie is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the trie; consumers can sample it now or observe it without
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
export const isEmpty = <V, E, R>(ref: RefTrie<V, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Trie.isEmpty);

/**
 * Check if the Trie is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the trie; consumers can sample it now or observe it
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
export const isNonEmpty = <V, E, R>(ref: RefTrie<V, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, (t) => !Trie.isEmpty(t));

/**
 * Check if a key exists in the Trie.
 * @remarks
 * ## Why
 *
 * Makes has a live projection of the trie; consumers can sample it now or observe it without
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
  (key: string): <V, E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, key: string): RefSubject.Computed<boolean, E, R>;
} = dual(2, function has<V, E, R>(ref: RefTrie<V, E, R>, key: string) {
  return RefSubject.map(ref, Trie.has(key));
});

/**
 * Get all keys from the Trie.
 * @remarks
 * ## Why
 *
 * Projects trie state with keys for both current reads and future pushes, avoiding a second
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
export const keys = <V, E, R>(ref: RefTrie<V, E, R>): RefSubject.Computed<Array<string>, E, R> =>
  RefSubject.map(ref, (t) => Array.from(Trie.keys(t)));

/**
 * Get all values from the Trie.
 * @remarks
 * ## Why
 *
 * Projects trie state with values for both current reads and future pushes, avoiding a second
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
export const values = <V, E, R>(ref: RefTrie<V, E, R>): RefSubject.Computed<Array<V>, E, R> =>
  RefSubject.map(ref, (t) => Array.from(Trie.values(t)));

/**
 * Get all entries from the Trie.
 * @remarks
 * ## Why
 *
 * Projects trie state with entries for both current reads and future pushes, avoiding a second
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
export const entries = <V, E, R>(
  ref: RefTrie<V, E, R>,
): RefSubject.Computed<Array<[string, V]>, E, R> => RefSubject.map(ref, Trie.toEntries);

/**
 * Get all keys with a given prefix.
 * @remarks
 * ## Why
 *
 * Projects trie state with keys with prefix for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The keys with prefix view retains no independent state. An Effect read samples the source once;
 * Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const keysWithPrefix: {
  (prefix: string): <V, E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Array<string>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, prefix: string): RefSubject.Computed<Array<string>, E, R>;
} = dual(2, function keysWithPrefix<V, E, R>(ref: RefTrie<V, E, R>, prefix: string) {
  return RefSubject.map(ref, (t) => Array.from(Trie.keysWithPrefix(t, prefix)));
});

/**
 * Get all values with a given prefix.
 * @remarks
 * ## Why
 *
 * Projects trie state with values with prefix for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The values with prefix view retains no independent state. An Effect read samples the source
 * once; Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const valuesWithPrefix: {
  (prefix: string): <V, E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Array<V>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, prefix: string): RefSubject.Computed<Array<V>, E, R>;
} = dual(2, function valuesWithPrefix<V, E, R>(ref: RefTrie<V, E, R>, prefix: string) {
  return RefSubject.map(ref, (t) => Array.from(Trie.valuesWithPrefix(t, prefix)));
});

/**
 * Get all entries with a given prefix.
 * @remarks
 * ## Why
 *
 * Projects trie state with entries with prefix for both current reads and future pushes, avoiding
 * a second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The entries with prefix view retains no independent state. An Effect read samples the source
 * once; Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const entriesWithPrefix: {
  (
    prefix: string,
  ): <V, E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Array<[string, V]>, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, prefix: string): RefSubject.Computed<Array<[string, V]>, E, R>;
} = dual(2, function entriesWithPrefix<V, E, R>(ref: RefTrie<V, E, R>, prefix: string) {
  return RefSubject.map(ref, Trie.toEntriesWithPrefix(prefix));
});

/**
 * Get the longest prefix of a key that exists in the Trie.
 * @remarks
 * ## Why
 *
 * Models a longest-prefix lookup as Filtered state: an absent match fails an Effect read with
 * `NoSuchElementError`, while later pushes can make a match available.
 *
 * ## Ownership and lifetime
 *
 * The longest prefix of view retains no independent state. An Effect read samples the source once;
 * Fx observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const longestPrefixOf: {
  (
    key: string,
  ): <V, E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<[string, V] | undefined, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, key: string): RefSubject.Computed<[string, V] | undefined, E, R>;
} = dual(2, function longestPrefixOf<V, E, R>(ref: RefTrie<V, E, R>, key: string) {
  return RefSubject.map(ref, Trie.longestPrefixOf(key));
});

/**
 * Map values to a different type.
 * @remarks
 * ## Why
 *
 * Projects trie state with map values for both current reads and future pushes, avoiding a second
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
  <V, B>(
    f: (value: V, key: string) => B,
  ): <E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<Trie.Trie<B>, E, R>;
  <V, E, R, B>(
    ref: RefTrie<V, E, R>,
    f: (value: V, key: string) => B,
  ): RefSubject.Computed<Trie.Trie<B>, E, R>;
} = dual(2, function mapValues<V, E, R, B>(ref: RefTrie<V, E, R>, f: (value: V, key: string) => B) {
  return RefSubject.map(ref, Trie.map(f));
});

/**
 * Reduce the entries to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the trie; consumers can sample it now or observe it without
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
  <V, B>(
    b: B,
    f: (b: B, value: V, key: string) => B,
  ): <E, R>(ref: RefTrie<V, E, R>) => RefSubject.Computed<B, E, R>;
  <V, E, R, B>(
    ref: RefTrie<V, E, R>,
    b: B,
    f: (b: B, value: V, key: string) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<
  V,
  E,
  R,
  B,
>(ref: RefTrie<V, E, R>, b: B, f: (b: B, value: V, key: string) => B) {
  return RefSubject.map(ref, Trie.reduce(b, f));
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
  (key: string): <V, E, R>(ref: RefTrie<V, E, R>) => RefSubject.Filtered<V, E, R>;
  <V, E, R>(ref: RefTrie<V, E, R>, key: string): RefSubject.Filtered<V, E, R>;
} = dual(2, function get<V, E, R>(ref: RefTrie<V, E, R>, key: string) {
  return RefSubject.filterMap(ref, Trie.get(key));
});
