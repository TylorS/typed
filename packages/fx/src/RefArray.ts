/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import type * as C from "@typed/context"
import type * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import type * as Order from "effect/Order"
import * as ReadonlyArray from "effect/Array"
import type * as Scope from "effect/Scope"
import type * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"

/**
 * A RefArray is a RefSubject that is specialized over an array of values.
 * @since 1.18.0
 * @category models
 */
export interface RefArray<in out A, in out E = never, out R = never>
  extends RefSubject.RefSubject<ReadonlyArray<A>, E, R>
{}

/**
 * Construct a new RefArray with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<A, E, R>(
  initial: Effect.Effect<ReadonlyArray<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefArray<A, E>, never, R | Scope.Scope>
export function make<A, E, R>(
  initial: Fx.Fx<ReadonlyArray<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefArray<A, E>, never, R | Scope.Scope>

export function make<A, E, R>(
  initial: Effect.Effect<ReadonlyArray<A>, E, R> | Fx.Fx<ReadonlyArray<A>, E, R>,
  eq: Equivalence<A> = equals
): Effect.Effect<RefArray<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(
    initial,
    {
      eq: ReadonlyArray.getEquivalence(eq)
    }
  )
}

/**
 * Construct a Tagged RefArray
 * @since 1.18.0
 * @category constructors
 */

export function tagged<A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, never, C.IdentifierOf<I>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, never, C.IdentifierOf<I>>
}
export function tagged<E, A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, E, C.IdentifierOf<I>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<ReadonlyArray<A>, E, C.IdentifierOf<I>>
}

export function tagged(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ):
    | RefSubject.RefSubject.Tagged<ReadonlyArray<any>, any, ReadonlyArray<any>>
    | RefSubject.RefSubject.Tagged<ReadonlyArray<any>, never, ReadonlyArray<any>>

  <const I>(
    identifier: I
  ):
    | RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, any, ReadonlyArray<any>>
    | RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<any>>
} {
  return RefSubject.tagged<ReadonlyArray<any>>()
}

/**
 * Prepend a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prepend: {
  <A>(value: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: A): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function prepend<A, E, R>(ref: RefArray<A, E, R>, value: A) {
  return RefSubject.update(ref, ReadonlyArray.prepend(value))
})

/**
 * Prepend an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(
  2,
  function prependAll<A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>) {
    return RefSubject.update(ref, ReadonlyArray.prependAll(value))
  }
)

/**
 * Append a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const append: {
  <A>(value: A): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: A): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function append<A, E, R>(ref: RefArray<A, E, R>, value: A) {
  return RefSubject.update(ref, ReadonlyArray.append(value))
})

/**
 * Append an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(
    value: Iterable<A>
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function appendAll<A, E, R>(ref: RefArray<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, ReadonlyArray.appendAll(value))
})

/**
 * Drop the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const drop: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function drop<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.drop(n))
})

/**
 * Drop the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dropRight: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function dropRight<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.dropRight(n))
})

/**
 * Drop values from a RefArray while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const dropWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: unknown) => boolean
  ): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(
  2,
  function dropWhile<A, E, R>(ref: RefArray<A, E, R>, predicate: (a: unknown) => boolean) {
    return RefSubject.update(ref, ReadonlyArray.dropWhile(predicate))
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
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<ReadonlyArray<A>, E, R>
} = dual(2, function filterValues<A, E, R>(ref: RefArray<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, ReadonlyArray.filter(predicate))
})

/**
 * Get a value contained a particular index of a RefArray.
 * @since 1.18.0
 * @category filtered
 */
export const getIndex: {
  (index: number): <A, E, R>(ref: RefArray<A, E, R>) => RefSubject.Filtered<A, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, index: number): RefSubject.Filtered<A, E, R>
} = dual(2, function getIndex<A, E, R>(ref: RefArray<A, E, R>, index: number) {
  return RefSubject.filterMap(ref, ReadonlyArray.get(index))
})

/**
 * Group the values of a RefArray by a key.
 * @since 1.18.0
 * @category computed
 */
export const groupBy: {
  <A>(
    f: (a: A) => string
  ): <E, R>(
    ref: RefArray<A, E, R>
  ) => RefSubject.Computed<R, E, Record<string, ReadonlyArray<A>>>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    f: (a: A) => string
  ): RefSubject.Computed<R, E, Record<string, ReadonlyArray<A>>>
} = dual(2, function groupBy<A, E, R>(ref: RefArray<A, E, R>, f: (a: A) => string) {
  return RefSubject.map(ref, ReadonlyArray.groupBy(f))
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
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    index: number,
    a: A
  ): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(3, function insertAt<A, E, R>(ref: RefArray<A, E, R>, index: number, a: A) {
  return RefSubject.update(ref, (as) => Option.getOrElse(ReadonlyArray.insertAt(as, index, a), () => [...as, a]))
})

/**
 * Check to see if a RefArray is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, ReadonlyArray.isEmptyReadonlyArray)

/**
 * Check to see if a RefArray is non-empty.
 * @since 1.18.0
 * @category computed
 */
export const isNonEmpty = <A, E, R>(
  ref: RefArray<A, E, R>
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, ReadonlyArray.isNonEmptyReadonlyArray)

/**
 * Get the current length of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const length = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, ReadonlyArray.length)

/**
 * Map (Endomorphic) the values of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    f: (a: A, index: number) => A
  ): RefSubject.Computed<ReadonlyArray<A>, E, R>
} = dual(2, function mapValues<A, E, R>(ref: RefArray<A, E, R>, f: (a: A, index: number) => A) {
  return RefSubject.update(ref, ReadonlyArray.map(f))
})

/**
 * Map the values with their indexes of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(
    f: (a: A, index: number) => B
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<ReadonlyArray<B>, E, R>
  <A, E, R, B>(
    ref: RefArray<A, E, R>,
    f: (a: A, index: number) => B
  ): RefSubject.Computed<ReadonlyArray<B>, E, R>
} = dual(
  2,
  function mapValues<A, E, R, B>(ref: RefArray<A, E, R>, f: (a: A, index: number) => B) {
    return RefSubject.map(ref, ReadonlyArray.map(f))
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
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    index: number,
    f: (a: A) => A
  ): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(3, function modifyAt<A, E, R>(ref: RefArray<A, E, R>, index: number, f: (a: A) => A) {
  return RefSubject.update(ref, ReadonlyArray.modify(index, f))
})

/**
 * Partition the values of a RefArray using a predicate.
 * @since 1.18.0
 * @category computed
 */
export const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <E, R>(
    ref: RefArray<A, E, R>
  ) => RefSubject.Computed<R, E, readonly [ReadonlyArray<B>, ReadonlyArray<A>]>
  <A, E, R>(ref: RefArray<A, E, R>, predicate: (a: A) => boolean): RefSubject.Computed<
    never,
    E,
    readonly [ReadonlyArray<A>, ReadonlyArray<A>]
  >
} = dual(2, function partition<A, E, R>(ref: RefArray<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, ReadonlyArray.partition(predicate))
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
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(
    ref: RefArray<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): RefSubject.Computed<B, E, R>
} = dual(
  3,
  function reduce<A, E, R, B>(ref: RefArray<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
    return RefSubject.map(ref, ReadonlyArray.reduce(b, f))
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
  ): <E, R>(ref: RefArray<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(
    ref: RefArray<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): RefSubject.Computed<B, E, R>
} = dual(
  3,
  function reduceRight<A, E, R, B>(
    ref: RefArray<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ) {
    return RefSubject.map(ref, ReadonlyArray.reduceRight(b, f))
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
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    index: number,
    a: A
  ): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(3, function replaceAt<A, E, R>(ref: RefArray<A, E, R>, index: number, a: A) {
  return RefSubject.update(ref, ReadonlyArray.replace(index, a))
})

/**
 * Rotate the values of a RefArray by `n` places. Helpful for things like carousels.
 * @since 1.18.0
 * @category combinators
 */
export const rotate: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function rotate<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.rotate(n))
})

/**
 * Sort the values of a RefArray using a provided Order.
 * @since 1.18.0
 * @category combinators
 */
export const sortBy: {
  <A>(
    orders: Iterable<Order.Order<A>>
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    orders: Iterable<Order.Order<A>>
  ): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function sortBy<A, E, R>(ref: RefArray<A, E, R>, orders: Iterable<Order.Order<A>>) {
  return RefSubject.update(ref, ReadonlyArray.sortBy(...orders))
})

/**
 * Take the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const take: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function take<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.take(n))
})

/**
 * Take the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const takeRight: {
  (n: number): <A, E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(ref: RefArray<A, E, R>, n: number): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(2, function takeRight<A, E, R>(ref: RefArray<A, E, R>, n: number) {
  return RefSubject.update(ref, ReadonlyArray.takeRight(n))
})

/**
 * Take values from a RefArray while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <E, R>(ref: RefArray<A, E, R>) => Effect.Effect<ReadonlyArray<A>, E, R>
  <A, E, R>(
    ref: RefArray<A, E, R>,
    predicate: (a: unknown) => boolean
  ): Effect.Effect<ReadonlyArray<A>, E, R>
} = dual(
  2,
  function takeWhile<A, E, R>(ref: RefArray<A, E, R>, predicate: (a: unknown) => boolean) {
    return RefSubject.update(ref, ReadonlyArray.takeWhile(predicate))
  }
)

/**
 * Remove any duplicate values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dedupeWith =
  <A>(valueEq: Equivalence<A>) => <E, R>(ref: RefArray<A, E, R>): Effect.Effect<ReadonlyArray<A>, E, R> =>
    RefSubject.update(ref, ReadonlyArray.dedupeWith(valueEq))

/**
 * @since 1.18.0
 */
export const last = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, ReadonlyArray.last)

/**
 * @since 1.18.0
 */
export const head = <A, E, R>(ref: RefArray<A, E, R>): RefSubject.Filtered<A, E, R> =>
  RefSubject.filterMap(ref, ReadonlyArray.head)
