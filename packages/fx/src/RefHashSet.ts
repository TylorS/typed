/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import type * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as HashSet from "effect/HashSet"
import type * as Scope from "effect/Scope"
import type * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"

/**
 * A RefHashSet is a RefSubject that is specialized over an HashSet of values.
 * @since 1.18.0
 * @category models
 */
export interface RefHashSet<in out A, in out E = never, out R = never>
  extends RefSubject.RefSubject<HashSet.HashSet<A>, E, R>
{}

/**
 * @since 1.18.0
 */
export function make<A, E, R>(
  initial: Effect.Effect<HashSet.HashSet<A>, E, R> | Fx.Fx<HashSet.HashSet<A>, E, R>
): Effect.Effect<RefHashSet<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(
    initial
  )
}

/**
 * Create a Tagged RefHashSet
 * @since 1.18.0
 * @category constructors
 */
export const tagged: <A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashSet.HashSet<A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, HashSet.HashSet<A>>
} = <A>() => RefSubject.tagged<never, HashSet.HashSet<A>>()

/**
 * Add a value to the current state of a RefHashSet.
 * @since 1.18.0
 * @category combinators
 */
export const add: {
  <A>(value: A): <E, R>(ref: RefHashSet<A, E, R>) => Effect.Effect<HashSet.HashSet<A>, E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, value: A): Effect.Effect<HashSet.HashSet<A>, E, R>
} = dual(2, function add<A, E, R>(ref: RefHashSet<A, E, R>, value: A) {
  return RefSubject.update(ref, HashSet.add(value))
})

/**
 * Append an iterable of values to the current state of a RefHashSet.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(
    value: Iterable<A>
  ): <E, R>(ref: RefHashSet<A, E, R>) => Effect.Effect<HashSet.HashSet<A>, E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, value: Iterable<A>): Effect.Effect<HashSet.HashSet<A>, E, R>
} = dual(2, function appendAll<A, E, R>(ref: RefHashSet<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, (set) =>
    HashSet.mutate(set, (set) => {
      for (const a of value) {
        HashSet.add(set, a)
      }
    }))
})

/**
 * Filter the values of a RefHashSet using a predicate creating a Computed value.
 * @since 1.18.0
 * @category computed
 */
export const filterValues: {
  <A>(
    predicate: (a: A) => boolean
  ): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<HashSet.HashSet<A>, E, R>
  <A, E, R>(
    ref: RefHashSet<A, E, R>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<HashSet.HashSet<A>, E, R>
} = dual(2, function filterValues<A, E, R>(ref: RefHashSet<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, HashSet.filter(predicate))
})

/**
 * Get the current length of a RefHashSet.
 * @since 1.18.0
 * @category computed
 */
export const size = <A, E, R>(ref: RefHashSet<A, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, HashSet.size)

/**
 * Map (Endomorphic) the values of a RefHashSet.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A) => A
  ): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<HashSet.HashSet<A>, E, R>
  <A, E, R>(
    ref: RefHashSet<A, E, R>,
    f: (a: A) => A
  ): RefSubject.Computed<HashSet.HashSet<A>, E, R>
} = dual(2, function mapValues<A, E, R>(ref: RefHashSet<A, E, R>, f: (a: A) => A) {
  return RefSubject.update(ref, HashSet.map(f))
})

/**
 * Map the values with their indexes of a RefHashSet.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(
    f: (a: A) => B
  ): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<ReadonlyArray<B>, E, R>
  <A, E, R, B>(
    ref: RefHashSet<A, E, R>,
    f: (a: A) => B
  ): RefSubject.Computed<ReadonlyArray<B>, E, R>
} = dual(
  2,
  function mapValues<A, E, R, B>(ref: RefHashSet<A, E, R>, f: (a: A) => B) {
    return RefSubject.map(ref, HashSet.map(f))
  }
)

/**
 * Partition the values of a RefHashSet using a predicate.
 * @since 1.18.0
 * @category computed
 */
export const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <E, R>(
    ref: RefHashSet<A, E, R>
  ) => RefSubject.Computed<readonly [ReadonlyArray<B>, HashSet.HashSet<A>], E, R>
  <A, E, R>(ref: RefHashSet<A, E, R>, predicate: (a: A) => boolean): RefSubject.Computed<
    readonly [ReadonlyArray<A>, HashSet.HashSet<A>],
    E
  >
} = dual(2, function partition<A, E, R>(ref: RefHashSet<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, HashSet.partition(predicate))
})

/**
 * Reduce the values of a RefHashSet to a single value.
 * @since 1.18.0
 * @category computed
 */
export const reduce: {
  <A, B>(
    b: B,
    f: (b: B, a: A) => B
  ): <E, R>(ref: RefHashSet<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(
    ref: RefHashSet<A, E, R>,
    b: B,
    f: (b: B, a: A) => B
  ): RefSubject.Computed<B, E, R>
} = dual(
  3,
  function reduce<A, E, R, B>(ref: RefHashSet<A, E, R>, b: B, f: (b: B, a: A) => B) {
    return RefSubject.map(ref, HashSet.reduce(b, f))
  }
)
