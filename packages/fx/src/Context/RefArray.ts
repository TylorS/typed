/**
 * A Contextual wrapper around a RefArray
 * @since 1.18.0
 */

import type * as Context from "@typed/context"
import type * as Computed from "@typed/fx/Computed"
import * as RefSubject from "@typed/fx/Context/RefSubject"
import type * as Filtered from "@typed/fx/Filtered"
import type * as Effect from "effect/Effect"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
import type * as Order from "effect/Order"
import * as ReadonlyArray from "effect/ReadonlyArray"

import * as RA from "@typed/fx/RefArray"

/**
 * A Contextual wrapper around a RefArray
 * @since 1.18.0
 * @category models
 */
export interface RefArray<I, E, A> extends RefSubject.RefSubject<I, E, ReadonlyArray<A>> {}

/**
 * @since 1.18.0
 * @category constructors
 */
export function RefArray<E, A>(): {
  <const I extends Context.IdentifierConstructor<any>>(
    identifier: (id: typeof Context.id) => I
  ): RefSubject.RefSubject<Context.IdentifierOf<I>, E, ReadonlyArray<A>>

  <const I>(identifier: I): RefSubject.RefSubject<Context.IdentifierOf<I>, E, ReadonlyArray<A>>
} {
  return RefSubject.RefSubject<E, ReadonlyArray<A>>()
}

/**
 * @since 1.18.0
 * @category constructors
 */
export const make: <E, A>() => {
  <const I extends Context.IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => Context.IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject<Context.IdentifierOf<I>, E, ReadonlyArray<A>>
  <const I>(identifier: I): RefSubject.RefSubject<Context.IdentifierOf<I>, E, ReadonlyArray<A>>
} = RefArray

/**
 * Prepend a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prepend: {
  <A>(value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, value: A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function prepend<I, E, A>(ref: RefArray<I, E, A>, value: A) {
  return ref.tag.withEffect(RA.prepend(value))
})

/**
 * Prepend an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prependAll: {
  <A>(value: Iterable<A>): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, value: Iterable<A>): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function prepend<I, E, A>(ref: RefArray<I, E, A>, value: Iterable<A>) {
  return ref.tag.withEffect(RA.prependAll(value))
})

/**
 * Append a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const append: {
  <A>(value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, value: A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function append<I, E, A>(ref: RefArray<I, E, A>, value: A) {
  return ref.tag.withEffect(RA.append(value))
})

/**
 * Append an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(value: Iterable<A>): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, value: Iterable<A>): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function appendAll<I, E, A>(ref: RefArray<I, E, A>, value: Iterable<A>) {
  return ref.tag.withEffect(RA.appendAll(value))
})

/**
 * Drop the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const drop: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function drop<I, E, A>(ref: RefArray<I, E, A>, n: number) {
  return ref.tag.withEffect(RA.drop(n))
})

/**
 * Drop the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dropRight: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function dropRight<I, E, A>(ref: RefArray<I, E, A>, n: number) {
  return ref.tag.withEffect(RA.dropRight(n))
})

/**
 * Drop values from a RefArray while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const dropWhile: {
  <A>(predicate: (value: A) => boolean): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function dropWhile<I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean) {
  return ref.tag.withEffect(RA.dropWhile(predicate))
})

/**
 * Filter the values of a RefArray using a predicate creating a Computed value.
 * @since 1.18.0
 * @category computed
 */
export const filterValues: {
  <A>(predicate: (value: A) => boolean): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, A>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Computed.Computed<I, E, A>
} = dual(2, function filterValues<I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean) {
  return ref.map(ReadonlyArray.filter(predicate))
})

/**
 * Get a value contained a particular index of a RefArray.
 * @since 1.18.0
 * @category filtered
 */
export const getIndex: {
  (index: number): <I, E, A>(ref: RefArray<I, E, A>) => Filtered.Filtered<I, E, A>
  <I, E, A>(ref: RefArray<I, E, A>, index: number): Filtered.Filtered<I, E, A>
} = dual(2, function getIndex<I, E, A>(ref: RefArray<I, E, A>, index: number) {
  return ref.filterMap(ReadonlyArray.get(index))
})

/**
 * Group the values of a RefArray by a key into a record.
 * @since 1.18.0
 * @category computed
 */
export const groupBy: {
  <A>(
    f: (value: A) => string
  ): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, Record<string, ReadonlyArray<A>>>
  <I, E, A>(ref: RefArray<I, E, A>, f: (value: A) => string): Computed.Computed<I, E, Record<string, ReadonlyArray<A>>>
} = dual(2, function groupBy<I, E, A>(ref: RefArray<I, E, A>, f: (value: A) => string) {
  return ref.map(ReadonlyArray.groupBy(f))
})

/**
 * Insert a value at a particular index of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const insertAt: {
  <A>(index: number, value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, index: number, value: A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(3, function insertAt<I, E, A>(ref: RefArray<I, E, A>, index: number, value: A) {
  return ref.tag.withEffect(RA.insertAt(index, value))
})

/**
 * Check to see if a RefArray is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <I, E, A>(ref: RefArray<I, E, A>) => ref.map(ReadonlyArray.isEmptyReadonlyArray)

/**
 * Check to see if a RefArray is not empty.
 * @since 1.18.0
 * @category computed
 */
export const isNonEmpty = <I, E, A>(ref: RefArray<I, E, A>) => ref.map(ReadonlyArray.isNonEmptyReadonlyArray)

/**
 * Get the current length of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const length = <I, E, A>(ref: RefArray<I, E, A>) => ref.map(ReadonlyArray.length)

/**
 * Map (Endomorphic) the values and their indexes of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(f: (value: A, index: number) => A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, f: (value: A, index: number) => A): Effect.Effect<I, E, ReadonlyArray<A>>
} = dual(
  2,
  function map<I, E, A>(
    ref: RefArray<I, E, A>,
    f: (value: A, index: number) => A
  ): Effect.Effect<I, E, ReadonlyArray<A>> {
    return ref.tag.withEffect(RA.map(f))
  }
)

/**
 * Map the values with their indexes of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(f: (value: A, index: number) => B): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, ReadonlyArray<B>>
  <I, E, A, B>(ref: RefArray<I, E, A>, f: (value: A, index: number) => B): Computed.Computed<I, E, ReadonlyArray<B>>
} = dual(2, function mapValues<I, E, A, B>(ref: RefArray<I, E, A>, f: (value: A, index: number) => B) {
  return ref.map(ReadonlyArray.map(f))
})

/**
 * Modify the value at a particular index of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const modifyAt: {
  <A>(index: number, f: (value: A) => A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, index: number, f: (value: A) => A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(3, function modifyAt<I, E, A>(ref: RefArray<I, E, A>, index: number, f: (value: A) => A) {
  return ref.tag.withEffect(RA.modifyAt(index, f))
})

/**
 * Partition the values of a RefArray using a predicate.
 * @since 1.18.0
 * @category computed
 */
export const partition: {
  <A>(
    predicate: (value: A) => boolean
  ): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, readonly [ReadonlyArray<A>, ReadonlyArray<A>]>
  <I, E, A>(
    ref: RefArray<I, E, A>,
    predicate: (value: A) => boolean
  ): Computed.Computed<I, E, readonly [ReadonlyArray<A>, ReadonlyArray<A>]>
} = dual(2, function partition<I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean) {
  return ref.map(ReadonlyArray.partition(predicate))
})

/**
 * Reduce the values of a RefArray to a single value.
 * @since 1.18.0
 * @category computed
 */
export const reduce: {
  <A, B>(
    initial: B,
    f: (accumulator: B, value: A, index: number) => B
  ): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, B>
  <I, E, A, B>(
    ref: RefArray<I, E, A>,
    initial: B,
    f: (accumulator: B, value: A, index: number) => B
  ): Computed.Computed<I, E, B>
} = dual(
  3,
  function reduce<I, E, A, B>(ref: RefArray<I, E, A>, initial: B, f: (accumulator: B, value: A, index: number) => B) {
    return ref.map(ReadonlyArray.reduce(initial, f))
  }
)

/**
 * Reduce the values of a RefArray to a single value in reverse order.
 * @since 1.18.0
 * @category computed
 */
export const reduceRight: {
  <A, B>(
    initial: B,
    f: (accumulator: B, value: A, index: number) => B
  ): <I, E>(ref: RefArray<I, E, A>) => Computed.Computed<I, E, B>
  <I, E, A, B>(
    ref: RefArray<I, E, A>,
    initial: B,
    f: (accumulator: B, value: A, index: number) => B
  ): Computed.Computed<I, E, B>
} = dual(3, function reduceRight<I, E, A, B>(
  ref: RefArray<I, E, A>,
  initial: B,
  f: (accumulator: B, value: A, index: number) => B
) {
  return ref.map(ReadonlyArray.reduceRight(initial, f))
})

/**
 * Replace a value at a particular index of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const replaceAt: {
  <A>(index: number, value: A): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, index: number, value: A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(3, function replaceAt<I, E, A>(ref: RefArray<I, E, A>, index: number, value: A) {
  return ref.tag.withEffect(RA.replaceAt(index, value))
})

/**
 * Rotate the values of a RefArray by `n` places. Helpful for things like carousels.
 * @since 1.18.0
 * @category combinators
 */
export const rotate: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function rotate<I, E, A>(ref: RefArray<I, E, A>, n: number) {
  return ref.tag.withEffect(RA.rotate(n))
})

/**
 * Sort the values of a RefArray using a provided Order.
 * @since 1.18.0
 * @category combinators
 */
export const sortBy: {
  <A>(orders: Iterable<Order.Order<A>>): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, orders: Iterable<Order.Order<A>>): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function sortBy<I, E, A>(ref: RefArray<I, E, A>, orders: Iterable<Order.Order<A>>) {
  return ref.tag.withEffect(RA.sortBy(orders))
})

/**
 * Take the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const take: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function take<I, E, A>(ref: RefArray<I, E, A>, n: number) {
  return ref.tag.withEffect(RA.take(n))
})

/**
 * Take the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const takeRight: {
  (n: number): <I, E, A>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function takeRight<I, E, A>(ref: RefArray<I, E, A>, n: number) {
  return ref.tag.withEffect(RA.takeRight(n))
})

/**
 * Take values from a RefArray while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const takeWhile: {
  <A>(predicate: (value: A) => boolean): <I, E>(ref: RefArray<I, E, A>) => Effect.Effect<I, E, ReadonlyArray<A>>
  <I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function takeWhile<I, E, A>(ref: RefArray<I, E, A>, predicate: (value: A) => boolean) {
  return ref.tag.withEffect(RA.takeWhile(predicate))
})

/**
 * Remove any duplicate values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dedupeWith = <A>(eq: Equivalence<A>) => <I, E>(ref: RefArray<I, E, A>) =>
  ref.tag.withEffect(RA.dedupeWith(eq))
