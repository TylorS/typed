/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import { equals } from "@effect/data/Equal"
import type { Equivalence } from "@effect/data/Equivalence"
import { dual } from "@effect/data/Function"
import * as Option from "@effect/data/Option"
import type * as Order from "@effect/data/Order"
import * as ReadonlyArray from "@effect/data/ReadonlyArray"
import type * as Effect from "@effect/io/Effect"
import type * as Scope from "@effect/io/Scope"
import type * as Computed from "@typed/fx/Computed"
import type * as Filtered from "@typed/fx/Filtered"
import type * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"

/**
 * A RefArray is a RefSubject that is specialized over an array of values.
 * @since 1.18.0
 * @category models
 */
export interface RefArray<E, A> extends RefSubject.RefSubject<E, ReadonlyArray<A>> {}

/**
 * Construct a new RefArray with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function makeRefArray<R, E, A>(
  initial: Effect.Effect<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefArray<E, A>>
export function makeRefArray<R, E, A>(
  initial: Fx.Fx<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefArray<E, A>>

export function makeRefArray<R, E, A>(
  initial: Fx.Fx<R, E, ReadonlyArray<A>>,
  eq: Equivalence<A> = equals
): Effect.Effect<R | Scope.Scope, never, RefArray<E, A>> {
  return RefSubject.makeWithExtension(
    initial,
    () => ({ valueEq: eq }),
    ReadonlyArray.getEquivalence(eq)
  )
}

/**
 * Prepend a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prepend: {
  <A>(value: A): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, value: A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function prepend<E, A>(ref: RefArray<E, A>, value: A) {
  return ref.update(ReadonlyArray.prepend(value))
})

/**
 * Prepend an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prependAll: {
  <A>(value: Iterable<A>): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, value: Iterable<A>): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(
  2,
  function prependAll<E, A>(ref: RefArray<E, A>, value: Iterable<A>) {
    return ref.update(ReadonlyArray.prependAll(value))
  }
)

/**
 * Append a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const append: {
  <A>(value: A): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, value: A): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function append<E, A>(ref: RefArray<E, A>, value: A) {
  return ref.update(ReadonlyArray.append(value))
})

/**
 * Append an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(
    value: Iterable<A>
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, value: Iterable<A>): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function appendAll<E, A>(ref: RefArray<E, A>, value: Iterable<A>) {
  return ref.update(ReadonlyArray.appendAll(value))
})

/**
 * Drop the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const drop: {
  (n: number): <E, A>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function drop<E, A>(ref: RefArray<E, A>, n: number) {
  return ref.update(ReadonlyArray.drop(n))
})

/**
 * Drop the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dropRight: {
  (n: number): <E, A>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function dropRight<E, A>(ref: RefArray<E, A>, n: number) {
  return ref.update(ReadonlyArray.dropRight(n))
})

/**
 * Drop values from a RefArray while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const dropWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    predicate: (a: unknown) => boolean
  ): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(
  2,
  function dropWhile<E, A>(ref: RefArray<E, A>, predicate: (a: unknown) => boolean) {
    return ref.update(ReadonlyArray.dropWhile(predicate))
  }
)

/**
 * Filter the values of a RefArray using a predicate creating a Computed value.
 * @since 1.18.0
 * @category computed
 */
export const filterValues: {
  <A>(
    predicate: (a: A) => boolean
  ): <E>(ref: RefArray<E, A>) => Computed.Computed<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    predicate: (a: A) => boolean
  ): Computed.Computed<never, E, ReadonlyArray<A>>
} = dual(2, function filterValues<E, A>(ref: RefArray<E, A>, predicate: (a: A) => boolean) {
  return ref.map(ReadonlyArray.filter(predicate))
})

/**
 * Get a value contained a particular index of a RefArray.
 * @since 1.18.0
 * @category filtered
 */
export const getIndex: {
  (index: number): <E, A>(ref: RefArray<E, A>) => Filtered.Filtered<never, E, A>
  <E, A>(ref: RefArray<E, A>, index: number): Filtered.Filtered<never, E, A>
} = dual(2, function getIndex<E, A>(ref: RefArray<E, A>, index: number) {
  return ref.filterMap(ReadonlyArray.get(index))
})

/**
 * Group the values of a RefArray by a key.
 * @since 1.18.0
 * @category computed
 */
export const groupBy: {
  <A>(
    f: (a: A) => string
  ): <E>(
    ref: RefArray<E, A>
  ) => Computed.Computed<never, E, Record<string, ReadonlyArray<A>>>
  <E, A>(
    ref: RefArray<E, A>,
    f: (a: A) => string
  ): Computed.Computed<never, E, Record<string, ReadonlyArray<A>>>
} = dual(2, function groupBy<E, A>(ref: RefArray<E, A>, f: (a: A) => string) {
  return ref.map(ReadonlyArray.groupBy(f))
})

/**
 * Insert a value at a particular index of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const insertAt: {
  <A>(
    index: number,
    a: A
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    index: number,
    a: A
  ): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(3, function insertAt<E, A>(ref: RefArray<E, A>, index: number, a: A) {
  return ref.update((as) => Option.getOrElse(ReadonlyArray.insertAt(as, index, a), () => as))
})

/**
 * Check to see if a RefArray is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <E, A>(ref: RefArray<E, A>): Computed.Computed<never, E, boolean> =>
  ref.map(ReadonlyArray.isEmptyReadonlyArray)

/**
 * Check to see if a RefArray is non-empty.
 * @since 1.18.0
 * @category computed
 */
export const isNonEmpty = <E, A>(
  ref: RefArray<E, A>
): Computed.Computed<never, E, boolean> => ref.map(ReadonlyArray.isNonEmptyReadonlyArray)

/**
 * Get the current length of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const length = <E, A>(ref: RefArray<E, A>): Computed.Computed<never, E, number> => ref.map(ReadonlyArray.length)

/**
 * Map (Endomorphic) the values of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A
  ): <E>(ref: RefArray<E, A>) => Computed.Computed<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    f: (a: A, index: number) => A
  ): Computed.Computed<never, E, ReadonlyArray<A>>
} = dual(2, function mapValues<E, A>(ref: RefArray<E, A>, f: (a: A, index: number) => A) {
  return ref.update(ReadonlyArray.map(f))
})

/**
 * Map the values with their indexes of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(
    f: (a: A, index: number) => B
  ): <E>(ref: RefArray<E, A>) => Computed.Computed<never, E, ReadonlyArray<B>>
  <E, A, B>(
    ref: RefArray<E, A>,
    f: (a: A, index: number) => B
  ): Computed.Computed<never, E, ReadonlyArray<B>>
} = dual(
  2,
  function mapValues<E, A, B>(ref: RefArray<E, A>, f: (a: A, index: number) => B) {
    return ref.map(ReadonlyArray.map(f))
  }
)

/**
 * Modify the value at a particular index of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const modifyAt: {
  <A>(
    index: number,
    f: (a: A) => A
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    index: number,
    f: (a: A) => A
  ): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(3, function modifyAt<E, A>(ref: RefArray<E, A>, index: number, f: (a: A) => A) {
  return ref.update(ReadonlyArray.modify(index, f))
})

/**
 * Partition the values of a RefArray using a predicate.
 * @since 1.18.0
 * @category computed
 */
export const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <E>(
    ref: RefArray<E, A>
  ) => Computed.Computed<never, E, readonly [ReadonlyArray<B>, ReadonlyArray<A>]>
  <E, A>(ref: RefArray<E, A>, predicate: (a: A) => boolean): Computed.Computed<
    never,
    E,
    readonly [ReadonlyArray<A>, ReadonlyArray<A>]
  >
} = dual(2, function partition<E, A>(ref: RefArray<E, A>, predicate: (a: A) => boolean) {
  return ref.map(ReadonlyArray.partition(predicate))
})

/**
 * Reduce the values of a RefArray to a single value.
 * @since 1.18.0
 * @category computed
 */
export const reduce: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B
  ): <E>(ref: RefArray<E, A>) => Computed.Computed<never, E, B>
  <E, A, B>(
    ref: RefArray<E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): Computed.Computed<never, E, B>
} = dual(
  3,
  function reduce<E, A, B>(ref: RefArray<E, A>, b: B, f: (b: B, a: A, index: number) => B) {
    return ref.map(ReadonlyArray.reduce(b, f))
  }
)

/**
 * Reduce the values of a RefArray to a single value in reverse order.
 * @since 1.18.0
 * @category computed
 */
export const reduceRight: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B
  ): <E>(ref: RefArray<E, A>) => Computed.Computed<never, E, B>
  <E, A, B>(
    ref: RefArray<E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): Computed.Computed<never, E, B>
} = dual(
  3,
  function reduceRight<E, A, B>(
    ref: RefArray<E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ) {
    return ref.map(ReadonlyArray.reduceRight(b, f))
  }
)

/**
 * Replace a value at a particular index of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const replaceAt: {
  <A>(
    index: number,
    a: A
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    index: number,
    a: A
  ): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(3, function replaceAt<E, A>(ref: RefArray<E, A>, index: number, a: A) {
  return ref.update(ReadonlyArray.replace(index, a))
})

/**
 * Rotate the values of a RefArray by `n` places. Helpful for things like carousels.
 * @since 1.18.0
 * @category combinators
 */
export const rotate: {
  (n: number): <E, A>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function rotate<E, A>(ref: RefArray<E, A>, n: number) {
  return ref.update(ReadonlyArray.rotate(n))
})

/**
 * Sort the values of a RefArray using a provided Order.
 * @since 1.18.0
 * @category combinators
 */
export const sortBy: {
  <A>(
    orders: Iterable<Order.Order<A>>
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    orders: Iterable<Order.Order<A>>
  ): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function sortBy<E, A>(ref: RefArray<E, A>, orders: Iterable<Order.Order<A>>) {
  return ref.update(ReadonlyArray.sortBy(...orders))
})

/**
 * Take the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const take: {
  (n: number): <E, A>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function take<E, A>(ref: RefArray<E, A>, n: number) {
  return ref.update(ReadonlyArray.take(n))
})

/**
 * Take the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const takeRight: {
  (n: number): <E, A>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(ref: RefArray<E, A>, n: number): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(2, function takeRight<E, A>(ref: RefArray<E, A>, n: number) {
  return ref.update(ReadonlyArray.takeRight(n))
})

/**
 * Take values from a RefArray while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <E>(ref: RefArray<E, A>) => Effect.Effect<never, E, ReadonlyArray<A>>
  <E, A>(
    ref: RefArray<E, A>,
    predicate: (a: unknown) => boolean
  ): Effect.Effect<never, E, ReadonlyArray<A>>
} = dual(
  2,
  function takeWhile<E, A>(ref: RefArray<E, A>, predicate: (a: unknown) => boolean) {
    return ref.update(ReadonlyArray.takeWhile(predicate))
  }
)

/**
 * Remove any duplicate values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dedupeWith =
  <A>(valueEq: Equivalence<A>) => <E>(ref: RefArray<E, A>): Effect.Effect<never, E, ReadonlyArray<A>> =>
    ref.update(ReadonlyArray.dedupeWith(valueEq))
