/**
 * Extensions to RefSubject for working with Record values
 * @since 1.18.0
 */

import { Result } from "effect";
import type * as Effect from "effect/Effect";
import { equals } from "effect/Equal";
import { dual } from "effect/Function";
import * as Option from "effect/Option";
import * as Record from "effect/Record";
import type * as Scope from "effect/Scope";
import type * as Fx from "../Fx/index.js";
import * as RefSubject from "./RefSubject.js";

/**
 * A RefRecord is a RefSubject specialized over a Record.
 * @remarks
 * ## Why
 *
 * Defines record state with the same current-read, pushed-update, and synchronized-write contract
 * as RefSubject.
 *
 * ## Ownership and lifetime
 *
 * RefRecord is a contract and performs no acquisition. Implementations retain the errors,
 * services, interruption, and Scope requirements expressed by its members.
 *
 * @since 1.18.0
 * @category State models
 */
export interface RefRecord<
  in out K extends string,
  in out V,
  in out E = never,
  out R = never,
> extends RefSubject.RefSubject<Record.ReadonlyRecord<K, V>, E, R> {}

/**
 * Creates a new `RefRecord` from a Record, `Effect`, or `Fx`.
 * @remarks
 * ## Why
 *
 * Creates record state with equality suited to that Effect data type, so unchanged values do not
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
export function make<K extends string, V, E = never, R = never>(
  initial:
    | Record.ReadonlyRecord<K, V>
    | Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>
    | Fx.Fx<Record.ReadonlyRecord<K, V>, E, R>,
): Effect.Effect<RefRecord<K, V, E>, never, R | Scope.Scope> {
  return RefSubject.make(initial, { eq: equals });
}

// ========================================
// Combinators
// ========================================

/**
 * Set a key-value pair in the Record.
 * @remarks
 * ## Why
 *
 * Keeps set atomic with respect to competing RefSubject writes instead of splitting the read and
 * replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running set performs one serialized record transition and resolves with its committed value. It
 * acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const set: {
  <K extends string, V>(
    key: K,
    value: V,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    key: K,
    value: V,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(3, function set<K extends string, V, E, R>(ref: RefRecord<K, V, E, R>, key: K, value: V) {
  return RefSubject.update(ref, Record.set(key, value));
});

/**
 * Remove a key from the Record.
 * @remarks
 * ## Why
 *
 * Applies remove to the committed record value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running remove performs one serialized record transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const remove: {
  <K extends string>(
    key: K,
  ): <V, E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    key: K,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(2, function remove<K extends string, V, E, R>(ref: RefRecord<K, V, E, R>, key: K) {
  return RefSubject.update(ref, (r) => Record.remove(r, key) as Record.ReadonlyRecord<K, V>);
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
 * Running modify performs one serialized record transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const modify: {
  <K extends string, V>(
    key: K,
    f: (v: V) => V,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    key: K,
    f: (v: V) => V,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(3, function modify<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, key: K, f: (v: V) => V) {
  return RefSubject.update(ref, (r) => Option.getOrElse(Record.modify(r, key, f), () => r));
});

/**
 * Replace the value at a key if it exists.
 * @remarks
 * ## Why
 *
 * Keeps replace atomic with respect to competing RefSubject writes instead of splitting the read
 * and replacement into separate effects.
 *
 * ## Ownership and lifetime
 *
 * Running replace performs one serialized record transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const replace: {
  <K extends string, V>(
    key: K,
    value: V,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    key: K,
    value: V,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(3, function replace<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, key: K, value: V) {
  return RefSubject.update(ref, (r) => Option.getOrElse(Record.replace(r, key, value), () => r));
});

/**
 * Clear all entries from the Record.
 * @remarks
 * ## Why
 *
 * Applies clear to the committed record value and publishes only the result, preserving its
 * element order and equality rules.
 *
 * ## Ownership and lifetime
 *
 * Running clear performs one serialized record transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const clear = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R> =>
  RefSubject.update(ref, () => Record.empty() as Record.ReadonlyRecord<K, V>);

/**
 * Union with another record.
 * @remarks
 * ## Why
 *
 * Combines bulk record changes in one committed value, giving subscribers one coherent update
 * rather than a partially applied sequence.
 *
 * ## Ownership and lifetime
 *
 * Running union performs one serialized record transition and resolves with its committed value.
 * It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const union: {
  <K extends string, V>(
    that: Record.ReadonlyRecord<K, V>,
    combine?: (selfValue: V, thatValue: V) => V,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    that: Record.ReadonlyRecord<K, V>,
    combine?: (selfValue: V, thatValue: V) => V,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(
  (args) => RefSubject.isRefSubject(args[0]),
  function union<K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    that: Record.ReadonlyRecord<K, V>,
    combine?: (selfValue: V, thatValue: V) => V,
  ) {
    return RefSubject.update(
      ref,
      (r) => Record.union(r, that, combine ?? ((_, b) => b)) as Record.ReadonlyRecord<K, V>,
    );
  },
);

/**
 * Intersection with another record.
 * @remarks
 * ## Why
 *
 * Intersection with another record. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running intersection performs one serialized record transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const intersection: {
  <K extends string, V>(
    that: Record.ReadonlyRecord<K, V>,
    combine?: (selfValue: V, thatValue: V) => V,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    that: Record.ReadonlyRecord<K, V>,
    combine?: (selfValue: V, thatValue: V) => V,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(
  (args) => RefSubject.isRefSubject(args[0]),
  function intersection<K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    that: Record.ReadonlyRecord<K, V>,
    combine?: (selfValue: V, thatValue: V) => V,
  ) {
    return RefSubject.update(
      ref,
      (r) => Record.intersection(r, that, combine ?? ((_, b) => b)) as Record.ReadonlyRecord<K, V>,
    );
  },
);

/**
 * Difference with another record.
 * @remarks
 * ## Why
 *
 * Difference with another record. The operation remains attached to the RefSubject's versioned
 * state boundary.
 *
 * ## Ownership and lifetime
 *
 * Running difference performs one serialized record transition and resolves with its committed
 * value. It acquires no resource; failures and services remain those of the source ref.
 *
 * @since 1.18.0
 * @category State updates
 */
export const difference: {
  <K extends string, V>(
    that: Record.ReadonlyRecord<K, V>,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    that: Record.ReadonlyRecord<K, V>,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(2, function difference<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, that: Record.ReadonlyRecord<K, V>) {
  return RefSubject.update(ref, (r) => Record.difference(r, that) as Record.ReadonlyRecord<K, V>);
});

/**
 * Filter entries in place.
 * @remarks
 * ## Why
 *
 * Applies filter to the committed Record through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed Record and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const filter: {
  <K extends string, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(2, function filter<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.update(ref, (r) => Record.filter(r, predicate) as Record.ReadonlyRecord<K, V>);
});

/**
 * Map values in place (endomorphic).
 * @remarks
 * ## Why
 *
 * Applies map to the committed Record through `RefSubject.update` and publishes one coherent
 * replacement; this is a mutation, not a read-only Computed projection.
 *
 * ## Ownership and lifetime
 *
 * The Effect starts when run, participates in the source ref's serialized update boundary, and
 * acquires no resource. It returns the committed Record and retains the ref's E and R channels.
 * @since 1.18.0
 * @category State updates
 */
export const map: {
  <K extends string, V>(
    f: (value: V, key: K) => V,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    f: (value: V, key: K) => V,
  ): Effect.Effect<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(2, function map<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, f: (value: V, key: K) => V) {
  return RefSubject.update(ref, (r) => Record.map(r, f) as Record.ReadonlyRecord<K, V>);
});

// ========================================
// Computed
// ========================================

/**
 * Get the current size of the Record.
 * @remarks
 * ## Why
 *
 * Makes size a live projection of the record; consumers can sample it now or observe it without
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
export const size = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): RefSubject.Computed<number, E, R> => RefSubject.map(ref, Record.size);

/**
 * Check if the Record is empty.
 * @remarks
 * ## Why
 *
 * Makes is empty a live projection of the record; consumers can sample it now or observe it
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
export const isEmpty = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, Record.isEmptyRecord);

/**
 * Check if the Record is non-empty.
 * @remarks
 * ## Why
 *
 * Makes is non empty a live projection of the record; consumers can sample it now or observe it
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
export const isNonEmpty = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, (r) => !Record.isEmptyRecord(r));

/**
 * Check if a key exists in the Record.
 * @remarks
 * ## Why
 *
 * Makes has a live projection of the record; consumers can sample it now or observe it without
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
  <K extends string>(
    key: K,
  ): <V, E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    key: K,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function has<K extends string, V, E, R>(ref: RefRecord<K, V, E, R>, key: K) {
  return RefSubject.map(ref, Record.has(key));
});

/**
 * Get all keys from the Record.
 * @remarks
 * ## Why
 *
 * Projects record state with keys for both current reads and future pushes, avoiding a second
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
export const keys = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): RefSubject.Computed<Array<K>, E, R> =>
  RefSubject.map(ref, Record.keys) as RefSubject.Computed<Array<K>, E, R>;

/**
 * Get all values from the Record.
 * @remarks
 * ## Why
 *
 * Projects record state with values for both current reads and future pushes, avoiding a second
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
export const values = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): RefSubject.Computed<Array<V>, E, R> => RefSubject.map(ref, Record.values);

/**
 * Get all entries from the Record.
 * @remarks
 * ## Why
 *
 * Projects record state with entries for both current reads and future pushes, avoiding a second
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
export const entries = <K extends string, V, E, R>(
  ref: RefRecord<K, V, E, R>,
): RefSubject.Computed<Array<[K, V]>, E, R> => RefSubject.map(ref, Record.toEntries);

/**
 * Map values to a different type.
 * @remarks
 * ## Why
 *
 * Projects record state with map values for both current reads and future pushes, avoiding a
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
  <K extends string, V, B>(
    f: (value: V, key: K) => B,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<Record.ReadonlyRecord<K, B>, E, R>;
  <K extends string, V, E, R, B>(
    ref: RefRecord<K, V, E, R>,
    f: (value: V, key: K) => B,
  ): RefSubject.Computed<Record.ReadonlyRecord<K, B>, E, R>;
} = dual(2, function mapValues<
  K extends string,
  V,
  E,
  R,
  B,
>(ref: RefRecord<K, V, E, R>, f: (value: V, key: K) => B) {
  return RefSubject.map(ref, (r) => Record.map(r, f) as Record.ReadonlyRecord<K, B>);
});

/**
 * Map keys to different keys.
 * @remarks
 * ## Why
 *
 * Projects record state with map keys for both current reads and future pushes, avoiding a second
 * mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map keys view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const mapKeys: {
  <K extends string, K2 extends string>(
    f: (key: K) => K2,
  ): <V, E, R>(
    ref: RefRecord<K, V, E, R>,
  ) => RefSubject.Computed<Record.ReadonlyRecord<K2, V>, E, R>;
  <K extends string, V, E, R, K2 extends string>(
    ref: RefRecord<K, V, E, R>,
    f: (key: K) => K2,
  ): RefSubject.Computed<Record.ReadonlyRecord<K2, V>, E, R>;
} = dual(2, function mapKeys<
  K extends string,
  V,
  E,
  R,
  K2 extends string,
>(ref: RefRecord<K, V, E, R>, f: (key: K) => K2) {
  return RefSubject.map(ref, (r) => Record.mapKeys(r, f) as Record.ReadonlyRecord<K2, V>);
});

/**
 * Map entries to new key-value pairs.
 * @remarks
 * ## Why
 *
 * Projects record state with map entries for both current reads and future pushes, avoiding a
 * second mutable cache of the derived value.
 *
 * ## Ownership and lifetime
 *
 * The map entries view retains no independent state. An Effect read samples the source once; Fx
 * observation follows later pushes and its observing Scope owns subscription cleanup.
 *
 * @since 1.18.0
 * @category Derived queries
 */
export const mapEntries: {
  <K extends string, V, K2 extends string, B>(
    f: (value: V, key: K) => [K2, B],
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<Record.ReadonlyRecord<K2, B>, E, R>;
  <K extends string, V, E, R, K2 extends string, B>(
    ref: RefRecord<K, V, E, R>,
    f: (value: V, key: K) => [K2, B],
  ): RefSubject.Computed<Record.ReadonlyRecord<K2, B>, E, R>;
} = dual(2, function mapEntries<
  K extends string,
  V,
  E,
  R,
  K2 extends string,
  B,
>(ref: RefRecord<K, V, E, R>, f: (value: V, key: K) => [K2, B]) {
  return RefSubject.map(ref, (r) => Record.mapEntries(r, f) as Record.ReadonlyRecord<K2, B>);
});

/**
 * Filter entries creating a Computed value.
 * @remarks
 * ## Why
 *
 * Projects record state with filter values for both current reads and future pushes, avoiding a
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
  <K extends string, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<Record.ReadonlyRecord<K, V>, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<Record.ReadonlyRecord<K, V>, E, R>;
} = dual(2, function filterValues<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(ref, (r) => Record.filter(r, predicate) as Record.ReadonlyRecord<K, V>);
});

/**
 * Filter and map values.
 * @remarks
 * ## Why
 *
 * Projects record state with filter map values for both current reads and future pushes, avoiding
 * a second mutable cache of the derived value.
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
  <K extends string, V, B>(
    f: (value: V, key: K) => Option.Option<B>,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<Record.ReadonlyRecord<K, B>, E, R>;
  <K extends string, V, E, R, B>(
    ref: RefRecord<K, V, E, R>,
    f: (value: V, key: K) => Option.Option<B>,
  ): RefSubject.Computed<Record.ReadonlyRecord<K, B>, E, R>;
} = dual(2, function filterMapValues<
  K extends string,
  V,
  E,
  R,
  B,
>(ref: RefRecord<K, V, E, R>, f: (value: V, key: K) => Option.Option<B>) {
  return RefSubject.map(ref, (r) =>
    Record.filterMap(r, (value, key) =>
      f(value, key) ? Result.succeed(value) : Result.fail(value),
    ),
  );
});

/**
 * Partition entries.
 * @remarks
 * ## Why
 *
 * Partition entries. The operation remains attached to the RefSubject's versioned state boundary.
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
  <K extends string, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(
    ref: RefRecord<K, V, E, R>,
  ) => RefSubject.Computed<[Record.ReadonlyRecord<K, V>, Record.ReadonlyRecord<K, V>], E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<[Record.ReadonlyRecord<K, V>, Record.ReadonlyRecord<K, V>], E, R>;
} = dual(2, function partition<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(
    ref,
    (r) =>
      Record.partition(r, (value, key) =>
        predicate(value, key) ? Result.succeed(value) : Result.fail(value),
      ) as [Record.ReadonlyRecord<K, V>, Record.ReadonlyRecord<K, V>],
  );
});

/**
 * Check if any entry satisfies a predicate.
 * @remarks
 * ## Why
 *
 * Makes some a live projection of the record; consumers can sample it now or observe it without
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
  <K extends string, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function some<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(ref, Record.some(predicate));
});

/**
 * Check if all entries satisfy a predicate.
 * @remarks
 * ## Why
 *
 * Makes every a live projection of the record; consumers can sample it now or observe it without
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
  <K extends string, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<boolean, E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Computed<boolean, E, R>;
} = dual(2, function every<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.map(ref, Record.every(predicate));
});

/**
 * Reduce the entries to a single value.
 * @remarks
 * ## Why
 *
 * Makes reduce a live projection of the record; consumers can sample it now or observe it without
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
  <K extends string, V, B>(
    b: B,
    f: (b: B, value: V, key: K) => B,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Computed<B, E, R>;
  <K extends string, V, E, R, B>(
    ref: RefRecord<K, V, E, R>,
    b: B,
    f: (b: B, value: V, key: K) => B,
  ): RefSubject.Computed<B, E, R>;
} = dual(3, function reduce<
  K extends string,
  V,
  E,
  R,
  B,
>(ref: RefRecord<K, V, E, R>, b: B, f: (b: B, value: V, key: K) => B) {
  return RefSubject.map(ref, Record.reduce(b, f));
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
  <K extends string>(key: K): <V, E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Filtered<V, E, R>;
  <K extends string, V, E, R>(ref: RefRecord<K, V, E, R>, key: K): RefSubject.Filtered<V, E, R>;
} = dual(2, function get<K extends string, V, E, R>(ref: RefRecord<K, V, E, R>, key: K) {
  return RefSubject.filterMap(ref, Record.get(key));
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
  <K extends string, V>(
    predicate: (value: V, key: K) => boolean,
  ): <E, R>(ref: RefRecord<K, V, E, R>) => RefSubject.Filtered<[K, V], E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    predicate: (value: V, key: K) => boolean,
  ): RefSubject.Filtered<[K, V], E, R>;
} = dual(2, function findFirst<
  K extends string,
  V,
  E,
  R,
>(ref: RefRecord<K, V, E, R>, predicate: (value: V, key: K) => boolean) {
  return RefSubject.filterMap(ref, (r) => Record.findFirst(r, predicate));
});

/**
 * Pop a value at a key as a Filtered.
 * @remarks
 * ## Why
 *
 * Models the possibly absent result of pop as Filtered state, so absence stays explicit while
 * later source versions can make a value available.
 *
 * ## Ownership and lifetime
 *
 * The pop view retains no independent value. Its Effect read fails with NoSuchElement
 * while absent; the observing Scope owns and finalizes its Fx subscription.
 *
 * @since 1.18.0
 * @category Optional queries
 */
export const pop: {
  <K extends string>(
    key: K,
  ): <V, E, R>(
    ref: RefRecord<K, V, E, R>,
  ) => RefSubject.Filtered<[V, Record.ReadonlyRecord<K, V>], E, R>;
  <K extends string, V, E, R>(
    ref: RefRecord<K, V, E, R>,
    key: K,
  ): RefSubject.Filtered<[V, Record.ReadonlyRecord<K, V>], E, R>;
} = dual(2, function pop<K extends string, V, E, R>(ref: RefRecord<K, V, E, R>, key: K) {
  return RefSubject.filterMap(ref, (r) => {
    return Option.map(
      Record.pop(r, key),
      ([value, next]) =>
        [value, next as Record.ReadonlyRecord<K, V>] as [V, Record.ReadonlyRecord<K, V>],
    );
  });
});
