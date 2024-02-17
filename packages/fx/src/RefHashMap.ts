/**
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import type { Scope } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as HashMap from "effect/HashMap"
import * as HashSet from "effect/HashSet"
import type { Option } from "effect/Option"
import type * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"

/**
 * A RefHashMap is a RefSubject that is specialized over a HashMap of values.
 * @since 1.18.0
 * @category models
 */
export interface RefHashMap<out R, in out E, in out K, in out V>
  extends RefSubject.RefSubject<R, E, HashMap.HashMap<K, V>>
{}

/**
 * Construct a new RefHashMap with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, K, V>(
  initial: Effect.Effect<HashMap.HashMap<K, V>, E, R>
): Effect.Effect<RefHashMap<never, E, K, V>, never, R | Scope.Scope>
export function make<R, E, K, V>(
  initial: Fx.Fx<R, E, HashMap.HashMap<K, V>>
): Effect.Effect<RefHashMap<never, E, K, V>, never, R | Scope.Scope>

export function make<R, E, K, V>(
  initial: Effect.Effect<HashMap.HashMap<K, V>, E, R> | Fx.Fx<R, E, HashMap.HashMap<K, V>>
): Effect.Effect<RefHashMap<never, E, K, V>, never, R | Scope.Scope> {
  return RefSubject.make(initial)
}

/**
 * Create a Tagged RefHashMap
 * @since 1.18.0
 * @category constructors
 */
export const tagged: <K, V>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashMap.HashMap<K, V>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashMap.HashMap<K, V>>
} = <E, A>() => RefSubject.tagged<never, HashMap.HashMap<E, A>>()

/**
 * This function creates a new RefHashMap from a given HashMap.
 * @since 1.18.0
 * @category constructors
 */
export function of<K, V>(
  map: HashMap.HashMap<K, V>
): Effect.Effect<RefHashMap<never, never, K, V>, never, Scope.Scope> {
  return make(Effect.succeed(map))
}

/**
 * Check if a key is available withing a HashMap
 * @since 1.18.0
 * @category computed
 */
export const has: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => RefSubject.Computed<R, E, boolean>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): RefSubject.Computed<R, E, boolean>
} = dual(2, function has<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): RefSubject.Computed<R, E, boolean> {
  return RefSubject.map(refHashMap, HashMap.has(key))
})

/**
 * Check if a key is available withing a HashMap
 * @since 1.18.0
 * @category computed
 */
export const hasHash: {
  <K>(key: K, hash: number): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => RefSubject.Computed<R, E, boolean>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, hash: number): RefSubject.Computed<R, E, boolean>
} = dual(
  3,
  function hasHash<R, E, K, V>(
    refHashMap: RefHashMap<R, E, K, V>,
    key: K,
    hash: number
  ): RefSubject.Computed<R, E, boolean> {
    return RefSubject.map(refHashMap, HashMap.hasHash(key, hash))
  }
)

/**
 * Check if HashMap is empty
 * @since 1.18.0
 * @category computed
 */
export function isEmpty<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): RefSubject.Computed<R, E, boolean> {
  return RefSubject.map(refHashMap, HashMap.isEmpty)
}

/**
 * Get the keys as a HashSet
 * @since 1.18.0
 * @category computed
 */
export function keySet<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): RefSubject.Computed<R, E, HashSet.HashSet<K>> {
  return RefSubject.map(refHashMap, HashMap.keySet)
}

/**
 * Get the keys as an Iterable
 * @since 1.18.0
 * @category computed
 */
export function keys<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): RefSubject.Computed<R, E, Iterable<K>> {
  return RefSubject.map(refHashMap, HashMap.keys)
}

/**
 * Map the values within the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <K, V>(
    f: (v: V, k: K) => V
  ): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, f: (v: V, k: K) => V): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(2, function map<R, E, K, V>(
  refHashMap: RefHashMap<R, E, K, V>,
  f: (v: V, k: K) => V
): Effect.Effect<HashMap.HashMap<K, V>, E, R> {
  return RefSubject.update(refHashMap, HashMap.map(f))
})

/**
 * Map the values within the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const modify: {
  <K, V>(
    key: K,
    f: (v: V) => V
  ): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(
    refHashMap: RefHashMap<R, E, K, V>,
    key: K,
    f: (v: V) => V
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(3, function map<R, E, K, V>(
  refHashMap: RefHashMap<R, E, K, V>,
  key: K,
  f: (v: V) => V
): Effect.Effect<HashMap.HashMap<K, V>, E, R> {
  return RefSubject.update(refHashMap, HashMap.modify(key, f))
})

/**
 * Map the values within the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const modifyAt: {
  <K, V>(
    key: K,
    f: HashMap.HashMap.UpdateFn<V>
  ): <R, E>(self: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(
    self: RefHashMap<R, E, K, V>,
    key: K,
    f: HashMap.HashMap.UpdateFn<V>
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(3, function modifyAt<R, E, K, V>(
  self: RefHashMap<R, E, K, V>,
  key: K,
  f: HashMap.HashMap.UpdateFn<V>
): Effect.Effect<HashMap.HashMap<K, V>, E, R> {
  return RefSubject.update(self, HashMap.modifyAt(key, f))
})

/**
 * Map the values within the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const modifyHash: {
  <K, V>(
    key: K,
    hash: number,
    f: HashMap.HashMap.UpdateFn<V>
  ): <R, E>(self: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(
    self: RefHashMap<R, E, K, V>,
    key: K,
    hash: number,
    f: HashMap.HashMap.UpdateFn<V>
  ): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(4, function modifyAt<R, E, K, V>(
  self: RefHashMap<R, E, K, V>,
  key: K,
  hash: number,
  f: HashMap.HashMap.UpdateFn<V>
): Effect.Effect<HashMap.HashMap<K, V>, E, R> {
  return RefSubject.update(self, HashMap.modifyHash(key, hash, f))
})

/**
 * Get the keys as an Iterable
 * @since 1.18.0
 * @category computed
 */
export const reduce: {
  <K, V, B>(
    seed: B,
    f: (acc: B, a: V, k: K) => B
  ): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => RefSubject.Computed<R, E, B>
  <R, E, K, V, B>(
    refHashMap: RefHashMap<R, E, K, V>,
    seed: B,
    f: (acc: B, a: V, k: K) => B
  ): RefSubject.Computed<R, E, B>
} = dual(3, function reduce<R, E, K, V, B>(
  refHashMap: RefHashMap<R, E, K, V>,
  seed: B,
  f: (acc: B, a: V, k: K) => B
): RefSubject.Computed<R, E, B> {
  return RefSubject.map(refHashMap, HashMap.reduce(seed, f))
})

/**
 * Remove a value at key from the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const remove: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(2, function remove<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K) {
  return RefSubject.update(refHashMap, HashMap.remove(key))
})

/**
 * Remove a value at key from the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const removeMany: {
  <K>(key: Iterable<K>): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: Iterable<K>): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(2, function removeMany<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: Iterable<K>) {
  return RefSubject.update(refHashMap, HashMap.removeMany(key))
})

/**
 * Set a value at a particular key in the HashMap
 * @since 1.18.0
 * @category combinators
 */
export const set: {
  <K, V>(
    key: K,
    value: V
  ): <R, E>(refHashMap: RefHashMap<R, E, K, V>) => Effect.Effect<HashMap.HashMap<K, V>, E, R>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, value: V): Effect.Effect<HashMap.HashMap<K, V>, E, R>
} = dual(3, function set<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, value: V) {
  return RefSubject.update(refHashMap, HashMap.set(key, value))
})

/**
 * Check the size of the HashMap
 * @since 1.18.0
 * @category computed
 */
export function size<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): RefSubject.Computed<R, E, number> {
  return RefSubject.map(refHashMap, HashMap.size)
}

/**
 * Get the values as an Iterable
 * @since 1.18.0
 * @category computed
 */
export function values<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>): RefSubject.Computed<R, E, Iterable<V>> {
  return RefSubject.map(refHashMap, HashMap.values)
}

/**
 * Get the values as an HashSet
 * @since 1.18.0
 * @category computed
 */
export function valuesSet<R, E, K, V>(
  refHashMap: RefHashMap<R, E, K, V>
): RefSubject.Computed<R, E, HashSet.HashSet<V>> {
  return RefSubject.map(values(refHashMap), HashSet.fromIterable)
}

/**
 * Create a projection of available values
 * @since 1.18.0
 * @category computed
 */
export function compact<R, E, K, V>(
  refHashMap: RefHashMap<R, E, K, Option<V>>
): RefSubject.Computed<R, E, HashMap.HashMap<K, V>> {
  return RefSubject.map(refHashMap, HashMap.compact)
}

/**
 * @since 1.18.0
 * @category filtered
 */
export const get: {
  <K>(key: K): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => RefSubject.Filtered<R, E, V>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K): RefSubject.Filtered<R, E, V>
} = dual(2, function get<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K) {
  return RefSubject.filterMap(refHashMap, HashMap.get(key))
})

/**
 * @since 1.18.0
 * @category filtered
 */
export const getHash: {
  <K>(key: K, hash: number): <R, E, V>(refHashMap: RefHashMap<R, E, K, V>) => RefSubject.Filtered<R, E, V>
  <R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K, hash: number): RefSubject.Filtered<R, E, V>
} = dual(2, function get<R, E, K, V>(refHashMap: RefHashMap<R, E, K, V>, key: K) {
  return RefSubject.filterMap(refHashMap, HashMap.get(key))
})
