/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import type * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as HashSet from "effect/HashSet"
import type * as Scope from "effect/Scope"
import type * as Computed from "./Computed.js"
import type * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"

/**
 * A RefHashSet is a RefSubject that is specialized over an HashSet of values.
 * @since 1.18.0
 * @category models
 */
export interface RefHashSet<R, E, A> extends RefSubject.RefSubject<R, E, HashSet.HashSet<A>> {}

/**
 * Construct a new RefHashSet with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  initial: Effect.Effect<R, E, HashSet.HashSet<A>>
): Effect.Effect<R | Scope.Scope, never, RefHashSet<never, E, A>>
export function make<R, E, A>(
  initial: Fx.Fx<R, E, HashSet.HashSet<A>>
): Effect.Effect<R | Scope.Scope, never, RefHashSet<never, E, A>>

export function make<R, E, A>(
  initial: Fx.FxInput<R, E, HashSet.HashSet<A>>
): Effect.Effect<R | Scope.Scope, never, RefHashSet<never, E, A>> {
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
  <A>(value: A): <R, E>(ref: RefHashSet<R, E, A>) => Effect.Effect<R, E, HashSet.HashSet<A>>
  <R, E, A>(ref: RefHashSet<R, E, A>, value: A): Effect.Effect<R, E, HashSet.HashSet<A>>
} = dual(2, function add<R, E, A>(ref: RefHashSet<R, E, A>, value: A) {
  return ref.update(HashSet.add(value))
})

/**
 * Append an iterable of values to the current state of a RefHashSet.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(
    value: Iterable<A>
  ): <R, E>(ref: RefHashSet<R, E, A>) => Effect.Effect<R, E, HashSet.HashSet<A>>
  <R, E, A>(ref: RefHashSet<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, HashSet.HashSet<A>>
} = dual(2, function appendAll<R, E, A>(ref: RefHashSet<R, E, A>, value: Iterable<A>) {
  return ref.update((set) =>
    HashSet.mutate(set, (set) => {
      for (const a of value) {
        HashSet.add(set, a)
      }
    })
  )
})

/**
 * Filter the values of a RefHashSet using a predicate creating a Computed value.
 * @since 1.18.0
 * @category computed
 */
export const filterValues: {
  <A>(
    predicate: (a: A) => boolean
  ): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, HashSet.HashSet<A>>
  <R, E, A>(
    ref: RefHashSet<R, E, A>,
    predicate: (a: A) => boolean
  ): Computed.Computed<R, E, HashSet.HashSet<A>>
} = dual(2, function filterValues<R, E, A>(ref: RefHashSet<R, E, A>, predicate: (a: A) => boolean) {
  return ref.map(HashSet.filter(predicate))
})

/**
 * Get the current length of a RefHashSet.
 * @since 1.18.0
 * @category computed
 */
export const size = <R, E, A>(ref: RefHashSet<R, E, A>): Computed.Computed<R, E, number> => ref.map(HashSet.size)

/**
 * Map (Endomorphic) the values of a RefHashSet.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A) => A
  ): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, HashSet.HashSet<A>>
  <R, E, A>(
    ref: RefHashSet<R, E, A>,
    f: (a: A) => A
  ): Computed.Computed<R, E, HashSet.HashSet<A>>
} = dual(2, function mapValues<R, E, A>(ref: RefHashSet<R, E, A>, f: (a: A) => A) {
  return ref.update(HashSet.map(f))
})

/**
 * Map the values with their indexes of a RefHashSet.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(
    f: (a: A) => B
  ): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, ReadonlyArray<B>>
  <R, E, A, B>(
    ref: RefHashSet<R, E, A>,
    f: (a: A) => B
  ): Computed.Computed<R, E, ReadonlyArray<B>>
} = dual(
  2,
  function mapValues<R, E, A, B>(ref: RefHashSet<R, E, A>, f: (a: A) => B) {
    return ref.map(HashSet.map(f))
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
  ): <R, E>(
    ref: RefHashSet<R, E, A>
  ) => Computed.Computed<R, E, readonly [ReadonlyArray<B>, HashSet.HashSet<A>]>
  <R, E, A>(ref: RefHashSet<R, E, A>, predicate: (a: A) => boolean): Computed.Computed<
    never,
    E,
    readonly [HashSet.HashSet<A>, HashSet.HashSet<A>]
  >
} = dual(2, function partition<R, E, A>(ref: RefHashSet<R, E, A>, predicate: (a: A) => boolean) {
  return ref.map(HashSet.partition(predicate))
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
  ): <R, E>(ref: RefHashSet<R, E, A>) => Computed.Computed<R, E, B>
  <R, E, A, B>(
    ref: RefHashSet<R, E, A>,
    b: B,
    f: (b: B, a: A) => B
  ): Computed.Computed<R, E, B>
} = dual(
  3,
  function reduce<R, E, A, B>(ref: RefHashSet<R, E, A>, b: B, f: (b: B, a: A) => B) {
    return ref.map(HashSet.reduce(b, f))
  }
)
