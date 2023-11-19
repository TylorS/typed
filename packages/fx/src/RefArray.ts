/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import type * as C from "@typed/context"
import type { RefArray } from "@typed/fx"
import type * as Computed from "@typed/fx/Computed"
import type * as Filtered from "@typed/fx/Filtered"
import type * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import type * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
import * as Option from "effect/Option"
import type * as Order from "effect/Order"
import * as ReadonlyArray from "effect/ReadonlyArray"
import type * as Scope from "effect/Scope"

/**
 * A RefArray is a RefSubject that is specialized over an array of values.
 * @since 1.18.0
 * @category models
 */
export interface RefArray<R, E, A> extends RefSubject.RefSubject<R, E, ReadonlyArray<A>> {}

/**
 * Construct a new RefArray with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  initial: Effect.Effect<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefArray<never, E, A>>
export function make<R, E, A>(
  initial: Fx.Fx<R, E, ReadonlyArray<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefArray<never, E, A>>

export function make<R, E, A>(
  initial: Fx.FxInput<R, E, ReadonlyArray<A>>,
  eq: Equivalence<A> = equals
): Effect.Effect<R | Scope.Scope, never, RefArray<never, E, A>> {
  return RefSubject.make(
    initial,
    ReadonlyArray.getEquivalence(eq)
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
  ): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<A>>
}
export function tagged<E, A>(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, E, ReadonlyArray<A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, E, ReadonlyArray<A>>
}

export function tagged(): {
  <const I extends C.IdentifierConstructor<any>>(
    identifier: (id: typeof C.id) => I
  ):
    | RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, any, ReadonlyArray<any>>
    | RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<any>>

  <const I>(
    identifier: I
  ):
    | RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, any, ReadonlyArray<any>>
    | RefSubject.RefSubject.Tagged<C.IdentifierOf<I>, never, ReadonlyArray<any>>
} {
  return RefSubject.tagged<any, ReadonlyArray<any>>()
}

/**
 * Prepend a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prepend: {
  <A>(value: A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, value: A): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function prepend<R, E, A>(ref: RefArray<R, E, A>, value: A) {
  return ref.update(ReadonlyArray.prepend(value))
})

/**
 * Prepend an iterable of values to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const prependAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(
  2,
  function prependAll<R, E, A>(ref: RefArray<R, E, A>, value: Iterable<A>) {
    return ref.update(ReadonlyArray.prependAll(value))
  }
)

/**
 * Append a value to the current state of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const append: {
  <A>(value: A): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, value: A): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function append<R, E, A>(ref: RefArray<R, E, A>, value: A) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function appendAll<R, E, A>(ref: RefArray<R, E, A>, value: Iterable<A>) {
  return ref.update(ReadonlyArray.appendAll(value))
})

/**
 * Drop the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const drop: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function drop<R, E, A>(ref: RefArray<R, E, A>, n: number) {
  return ref.update(ReadonlyArray.drop(n))
})

/**
 * Drop the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dropRight: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function dropRight<R, E, A>(ref: RefArray<R, E, A>, n: number) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    predicate: (a: unknown) => boolean
  ): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(
  2,
  function dropWhile<R, E, A>(ref: RefArray<R, E, A>, predicate: (a: unknown) => boolean) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Computed.Computed<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    predicate: (a: A) => boolean
  ): Computed.Computed<R, E, ReadonlyArray<A>>
} = dual(2, function filterValues<R, E, A>(ref: RefArray<R, E, A>, predicate: (a: A) => boolean) {
  return ref.map(ReadonlyArray.filter(predicate))
})

/**
 * Get a value contained a particular index of a RefArray.
 * @since 1.18.0
 * @category filtered
 */
export const getIndex: {
  (index: number): <R, E, A>(ref: RefArray<R, E, A>) => Filtered.Filtered<R, E, A>
  <R, E, A>(ref: RefArray<R, E, A>, index: number): Filtered.Filtered<R, E, A>
} = dual(2, function getIndex<R, E, A>(ref: RefArray<R, E, A>, index: number) {
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
  ): <R, E>(
    ref: RefArray<R, E, A>
  ) => Computed.Computed<R, E, Record<string, ReadonlyArray<A>>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    f: (a: A) => string
  ): Computed.Computed<R, E, Record<string, ReadonlyArray<A>>>
} = dual(2, function groupBy<R, E, A>(ref: RefArray<R, E, A>, f: (a: A) => string) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    index: number,
    a: A
  ): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(3, function insertAt<R, E, A>(ref: RefArray<R, E, A>, index: number, a: A) {
  return ref.update((as) => Option.getOrElse(ReadonlyArray.insertAt(as, index, a), () => [...as, a]))
})

/**
 * Check to see if a RefArray is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <R, E, A>(ref: RefArray<R, E, A>): Computed.Computed<R, E, boolean> =>
  ref.map(ReadonlyArray.isEmptyReadonlyArray)

/**
 * Check to see if a RefArray is non-empty.
 * @since 1.18.0
 * @category computed
 */
export const isNonEmpty = <R, E, A>(
  ref: RefArray<R, E, A>
): Computed.Computed<R, E, boolean> => ref.map(ReadonlyArray.isNonEmptyReadonlyArray)

/**
 * Get the current length of a RefArray.
 * @since 1.18.0
 * @category computed
 */
export const length = <R, E, A>(ref: RefArray<R, E, A>): Computed.Computed<R, E, number> =>
  ref.map(ReadonlyArray.length)

/**
 * Map (Endomorphic) the values of a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A
  ): <R, E>(ref: RefArray<R, E, A>) => Computed.Computed<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    f: (a: A, index: number) => A
  ): Computed.Computed<R, E, ReadonlyArray<A>>
} = dual(2, function mapValues<R, E, A>(ref: RefArray<R, E, A>, f: (a: A, index: number) => A) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Computed.Computed<R, E, ReadonlyArray<B>>
  <R, E, A, B>(
    ref: RefArray<R, E, A>,
    f: (a: A, index: number) => B
  ): Computed.Computed<R, E, ReadonlyArray<B>>
} = dual(
  2,
  function mapValues<R, E, A, B>(ref: RefArray<R, E, A>, f: (a: A, index: number) => B) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    index: number,
    f: (a: A) => A
  ): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(3, function modifyAt<R, E, A>(ref: RefArray<R, E, A>, index: number, f: (a: A) => A) {
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
  ): <R, E>(
    ref: RefArray<R, E, A>
  ) => Computed.Computed<R, E, readonly [ReadonlyArray<B>, ReadonlyArray<A>]>
  <R, E, A>(ref: RefArray<R, E, A>, predicate: (a: A) => boolean): Computed.Computed<
    never,
    E,
    readonly [ReadonlyArray<A>, ReadonlyArray<A>]
  >
} = dual(2, function partition<R, E, A>(ref: RefArray<R, E, A>, predicate: (a: A) => boolean) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Computed.Computed<R, E, B>
  <R, E, A, B>(
    ref: RefArray<R, E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): Computed.Computed<R, E, B>
} = dual(
  3,
  function reduce<R, E, A, B>(ref: RefArray<R, E, A>, b: B, f: (b: B, a: A, index: number) => B) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Computed.Computed<R, E, B>
  <R, E, A, B>(
    ref: RefArray<R, E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): Computed.Computed<R, E, B>
} = dual(
  3,
  function reduceRight<R, E, A, B>(
    ref: RefArray<R, E, A>,
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    index: number,
    a: A
  ): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(3, function replaceAt<R, E, A>(ref: RefArray<R, E, A>, index: number, a: A) {
  return ref.update(ReadonlyArray.replace(index, a))
})

/**
 * Rotate the values of a RefArray by `n` places. Helpful for things like carousels.
 * @since 1.18.0
 * @category combinators
 */
export const rotate: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function rotate<R, E, A>(ref: RefArray<R, E, A>, n: number) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    orders: Iterable<Order.Order<A>>
  ): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function sortBy<R, E, A>(ref: RefArray<R, E, A>, orders: Iterable<Order.Order<A>>) {
  return ref.update(ReadonlyArray.sortBy(...orders))
})

/**
 * Take the first `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const take: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function take<R, E, A>(ref: RefArray<R, E, A>, n: number) {
  return ref.update(ReadonlyArray.take(n))
})

/**
 * Take the last `n` values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const takeRight: {
  (n: number): <R, E, A>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(ref: RefArray<R, E, A>, n: number): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(2, function takeRight<R, E, A>(ref: RefArray<R, E, A>, n: number) {
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
  ): <R, E>(ref: RefArray<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>>
  <R, E, A>(
    ref: RefArray<R, E, A>,
    predicate: (a: unknown) => boolean
  ): Effect.Effect<R, E, ReadonlyArray<A>>
} = dual(
  2,
  function takeWhile<R, E, A>(ref: RefArray<R, E, A>, predicate: (a: unknown) => boolean) {
    return ref.update(ReadonlyArray.takeWhile(predicate))
  }
)

/**
 * Remove any duplicate values from a RefArray.
 * @since 1.18.0
 * @category combinators
 */
export const dedupeWith =
  <A>(valueEq: Equivalence<A>) => <R, E>(ref: RefArray<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> =>
    ref.update(ReadonlyArray.dedupeWith(valueEq))

export const last = <R, E, A>(ref: RefArray<R, E, A>): Filtered.Filtered<R, E, A> => ref.filterMap(ReadonlyArray.last)

export const head = <R, E, A>(ref: RefArray<R, E, A>): Filtered.Filtered<R, E, A> => ref.filterMap(ReadonlyArray.head)
