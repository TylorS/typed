/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import * as Chunk from "effect/Chunk"
import type * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
import type * as Scope from "effect/Scope"
import type * as Fx from "./Fx.js"
import * as RefSubject from "./RefSubject.js"

/**
 * A RefChunk is a RefSubject that is specialized over an Chunk of values.
 * @since 1.18.0
 * @category models
 */
export interface RefChunk<in out A, in out E = never, out R = never>
  extends RefSubject.RefSubject<Chunk.Chunk<A>, E, R>
{}

/**
 * Construct a new RefChunk with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<A, E, R>(
  initial: Effect.Effect<Chunk.Chunk<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefChunk<A, E>, never, R | Scope.Scope>
export function make<A, E, R>(
  initial: Fx.Fx<Chunk.Chunk<A>, E, R>,
  eq?: Equivalence<A>
): Effect.Effect<RefChunk<A, E>, never, R | Scope.Scope>

export function make<A, E, R>(
  initial: Fx.Fx<Chunk.Chunk<A>, E, R> | Effect.Effect<Chunk.Chunk<A>, E, R>,
  eq: Equivalence<A> = equals
): Effect.Effect<RefChunk<A, E>, never, R | Scope.Scope> {
  return RefSubject.make(
    initial,
    {
      eq: Chunk.getEquivalence(eq)
    }
  )
}

/**
 * Create a Tagged RefChunk
 * @since 1.18.0
 * @category constructors
 */
export const tagged: <A>() => {
  <const I extends IdentifierConstructor<any>>(
    identifier: (id: <const T>(uniqueIdentifier: T) => IdentifierConstructor<T>) => I
  ): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, Chunk.Chunk<A>>

  <const I>(identifier: I): RefSubject.RefSubject.Tagged<IdentifierOf<I>, never, Chunk.Chunk<A>>
} = <A>() => RefSubject.tagged<never, Chunk.Chunk<A>>()

/**
 * Prepend a value to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const prepend: {
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function prepend<A, E, R>(ref: RefChunk<A, E, R>, value: A) {
  return RefSubject.update(ref, Chunk.prepend(value))
})

/**
 * Prepend an iterable of values to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const prependAll: {
  <A>(value: Iterable<A>): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(
  2,
  function prependAll<A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>) {
    return RefSubject.update(ref, Chunk.prependAll(Chunk.fromIterable(value)))
  }
)

/**
 * Append a value to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const append: {
  <A>(value: A): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: A): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function append<A, E, R>(ref: RefChunk<A, E, R>, value: A) {
  return RefSubject.update(ref, Chunk.append(value))
})

/**
 * Append an iterable of values to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(
    value: Iterable<A>
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function appendAll<A, E, R>(ref: RefChunk<A, E, R>, value: Iterable<A>) {
  return RefSubject.update(ref, Chunk.appendAll(Chunk.fromIterable(value)))
})

/**
 * Drop the first `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const drop: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function drop<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.drop(n))
})

/**
 * Drop the last `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const dropRight: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function dropRight<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.dropRight(n))
})

/**
 * Drop values from a RefChunk while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const dropWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean
  ): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(
  2,
  function dropWhile<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
    return RefSubject.update(ref, Chunk.dropWhile(predicate))
  }
)

/**
 * Filter the values of a RefChunk using a predicate creating a Computed value.
 * @since 1.18.0
 * @category computed
 */
export const filterValues: {
  <A>(
    predicate: (a: A) => boolean
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<Chunk.Chunk<A>, E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean
  ): RefSubject.Computed<Chunk.Chunk<A>, E, R>
} = dual(2, function filterValues<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Chunk.filter(predicate))
})

/**
 * Get a value contained a particular index of a RefChunk.
 * @since 1.18.0
 * @category filtered
 */
export const getIndex: {
  (index: number): <A, E, R>(ref: RefChunk<A, E, R>) => RefSubject.Filtered<A, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, index: number): RefSubject.Filtered<A, E, R>
} = dual(2, function getIndex<A, E, R>(ref: RefChunk<A, E, R>, index: number) {
  return RefSubject.filterMap(ref, Chunk.get(index))
})

/**
 * Check to see if a RefChunk is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Computed<boolean, E, R> =>
  RefSubject.map(ref, Chunk.isEmpty)

/**
 * Check to see if a RefChunk is non-empty.
 * @since 1.18.0
 * @category computed
 */
export const isNonEmpty = <A, E, R>(
  ref: RefChunk<A, E, R>
): RefSubject.Computed<boolean, E, R> => RefSubject.map(ref, Chunk.isNonEmpty)

/**
 * Get the current length of a RefChunk.
 * @since 1.18.0
 * @category computed
 */
export const size = <A, E, R>(ref: RefChunk<A, E, R>): RefSubject.Computed<number, E, R> =>
  RefSubject.map(ref, Chunk.size)

/**
 * Map (Endomorphic) the values of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<Chunk.Chunk<A>, E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    f: (a: A, index: number) => A
  ): RefSubject.Computed<Chunk.Chunk<A>, E, R>
} = dual(2, function mapValues<A, E, R>(ref: RefChunk<A, E, R>, f: (a: A, index: number) => A) {
  return RefSubject.update(ref, Chunk.map(f))
})

/**
 * Map the values with their indexes of a RefChunk.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(
    f: (a: A, index: number) => B
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<ReadonlyArray<B>, E, R>
  <A, E, R, B>(
    ref: RefChunk<A, E, R>,
    f: (a: A, index: number) => B
  ): RefSubject.Computed<ReadonlyArray<B>, E, R>
} = dual(
  2,
  function mapValues<A, E, R, B>(ref: RefChunk<A, E, R>, f: (a: A, index: number) => B) {
    return RefSubject.map(ref, Chunk.map(f))
  }
)

/**
 * Modify the value at a particular index of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const modifyAt: {
  <A>(
    index: number,
    f: (a: A) => A
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    index: number,
    f: (a: A) => A
  ): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(3, function modifyAt<A, E, R>(ref: RefChunk<A, E, R>, index: number, f: (a: A) => A) {
  return RefSubject.update(ref, Chunk.modify(index, f))
})

/**
 * Partition the values of a RefChunk using a predicate.
 * @since 1.18.0
 * @category computed
 */
export const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <E, R>(
    ref: RefChunk<A, E, R>
  ) => RefSubject.Computed<readonly [ReadonlyArray<B>, Chunk.Chunk<A>], E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean): RefSubject.Computed<
    readonly [ReadonlyArray<A>, Chunk.Chunk<A>],
    E
  >
} = dual(2, function partition<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
  return RefSubject.map(ref, Chunk.partition(predicate))
})

/**
 * Reduce the values of a RefChunk to a single value.
 * @since 1.18.0
 * @category computed
 */
export const reduce: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(
    ref: RefChunk<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): RefSubject.Computed<B, E, R>
} = dual(
  3,
  function reduce<A, E, R, B>(ref: RefChunk<A, E, R>, b: B, f: (b: B, a: A, index: number) => B) {
    return RefSubject.map(ref, Chunk.reduce(b, f))
  }
)

/**
 * Reduce the values of a RefChunk to a single value in reverse order.
 * @since 1.18.0
 * @category computed
 */
export const reduceRight: {
  <A, B>(
    b: B,
    f: (b: B, a: A, index: number) => B
  ): <E, R>(ref: RefChunk<A, E, R>) => RefSubject.Computed<B, E, R>
  <A, E, R, B>(
    ref: RefChunk<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): RefSubject.Computed<B, E, R>
} = dual(
  3,
  function reduceRight<A, E, R, B>(
    ref: RefChunk<A, E, R>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ) {
    return RefSubject.map(ref, Chunk.reduceRight(b, f))
  }
)

/**
 * Replace a value at a particular index of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const replaceAt: {
  <A>(
    index: number,
    a: A
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    index: number,
    a: A
  ): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(3, function replaceAt<A, E, R>(ref: RefChunk<A, E, R>, index: number, a: A) {
  return RefSubject.update(ref, Chunk.replace(index, a))
})

/**
 * Take the first `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const take: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function take<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.take(n))
})

/**
 * Take the last `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const takeRight: {
  (n: number): <A, E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(ref: RefChunk<A, E, R>, n: number): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(2, function takeRight<A, E, R>(ref: RefChunk<A, E, R>, n: number) {
  return RefSubject.update(ref, Chunk.takeRight(n))
})

/**
 * Take values from a RefChunk while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <E, R>(ref: RefChunk<A, E, R>) => Effect.Effect<Chunk.Chunk<A>, E, R>
  <A, E, R>(
    ref: RefChunk<A, E, R>,
    predicate: (a: A) => boolean
  ): Effect.Effect<Chunk.Chunk<A>, E, R>
} = dual(
  2,
  function takeWhile<A, E, R>(ref: RefChunk<A, E, R>, predicate: (a: A) => boolean) {
    return RefSubject.update(ref, Chunk.takeWhile(predicate))
  }
)

/**
 * Remove any duplicate values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const dedupe = <A, E, R>(ref: RefChunk<A, E, R>): Effect.Effect<Chunk.Chunk<A>, E, R> =>
  RefSubject.update(ref, Chunk.dedupe)
