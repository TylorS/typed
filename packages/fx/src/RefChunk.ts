/**
 * Extensions to RefSubject for working with arrays of values
 * @since 1.18.0
 */

import type { IdentifierConstructor, IdentifierOf } from "@typed/context"
import type * as Computed from "@typed/fx/Computed"
import type * as Filtered from "@typed/fx/Filtered"
import type * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Chunk from "effect/Chunk"
import type * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import { dual } from "effect/Function"
import type * as Scope from "effect/Scope"

/**
 * A RefChunk is a RefSubject that is specialized over an Chunk of values.
 * @since 1.18.0
 * @category models
 */
export interface RefChunk<R, E, A> extends RefSubject.RefSubject<R, E, Chunk.Chunk<A>> {}

/**
 * Construct a new RefChunk with the given initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  initial: Effect.Effect<R, E, Chunk.Chunk<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefChunk<never, E, A>>
export function make<R, E, A>(
  initial: Fx.Fx<R, E, Chunk.Chunk<A>>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefChunk<never, E, A>>

export function make<R, E, A>(
  initial: Fx.FxInput<R, E, Chunk.Chunk<A>>,
  eq: Equivalence<A> = equals
): Effect.Effect<R | Scope.Scope, never, RefChunk<never, E, A>> {
  return RefSubject.make(
    initial,
    Chunk.getEquivalence(eq)
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
  <A>(value: A): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: A): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function prepend<R, E, A>(ref: RefChunk<R, E, A>, value: A) {
  return ref.update(Chunk.prepend(value))
})

/**
 * Prepend an iterable of values to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const prependAll: {
  <A>(value: Iterable<A>): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(
  2,
  function prependAll<R, E, A>(ref: RefChunk<R, E, A>, value: Iterable<A>) {
    return ref.update(Chunk.prependAll(Chunk.fromIterable(value)))
  }
)

/**
 * Append a value to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const append: {
  <A>(value: A): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: A): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function append<R, E, A>(ref: RefChunk<R, E, A>, value: A) {
  return ref.update(Chunk.append(value))
})

/**
 * Append an iterable of values to the current state of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const appendAll: {
  <A>(
    value: Iterable<A>
  ): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, value: Iterable<A>): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function appendAll<R, E, A>(ref: RefChunk<R, E, A>, value: Iterable<A>) {
  return ref.update(Chunk.appendAll(Chunk.fromIterable(value)))
})

/**
 * Drop the first `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const drop: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function drop<R, E, A>(ref: RefChunk<R, E, A>, n: number) {
  return ref.update(Chunk.drop(n))
})

/**
 * Drop the last `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const dropRight: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function dropRight<R, E, A>(ref: RefChunk<R, E, A>, n: number) {
  return ref.update(Chunk.dropRight(n))
})

/**
 * Drop values from a RefChunk while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const dropWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    predicate: (a: A) => boolean
  ): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(
  2,
  function dropWhile<R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean) {
    return ref.update(Chunk.dropWhile(predicate))
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
  ): <R, E>(ref: RefChunk<R, E, A>) => Computed.Computed<R, E, Chunk.Chunk<A>>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    predicate: (a: A) => boolean
  ): Computed.Computed<R, E, Chunk.Chunk<A>>
} = dual(2, function filterValues<R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean) {
  return ref.map(Chunk.filter(predicate))
})

/**
 * Get a value contained a particular index of a RefChunk.
 * @since 1.18.0
 * @category filtered
 */
export const getIndex: {
  (index: number): <R, E, A>(ref: RefChunk<R, E, A>) => Filtered.Filtered<R, E, A>
  <R, E, A>(ref: RefChunk<R, E, A>, index: number): Filtered.Filtered<R, E, A>
} = dual(2, function getIndex<R, E, A>(ref: RefChunk<R, E, A>, index: number) {
  return ref.filterMap(Chunk.get(index))
})

/**
 * Check to see if a RefChunk is empty.
 * @since 1.18.0
 * @category computed
 */
export const isEmpty = <R, E, A>(ref: RefChunk<R, E, A>): Computed.Computed<R, E, boolean> => ref.map(Chunk.isEmpty)

/**
 * Check to see if a RefChunk is non-empty.
 * @since 1.18.0
 * @category computed
 */
export const isNonEmpty = <R, E, A>(
  ref: RefChunk<R, E, A>
): Computed.Computed<R, E, boolean> => ref.map(Chunk.isNonEmpty)

/**
 * Get the current length of a RefChunk.
 * @since 1.18.0
 * @category computed
 */
export const size = <R, E, A>(ref: RefChunk<R, E, A>): Computed.Computed<R, E, number> => ref.map(Chunk.size)

/**
 * Map (Endomorphic) the values of a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const map: {
  <A>(
    f: (a: A, index: number) => A
  ): <R, E>(ref: RefChunk<R, E, A>) => Computed.Computed<R, E, Chunk.Chunk<A>>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    f: (a: A, index: number) => A
  ): Computed.Computed<R, E, Chunk.Chunk<A>>
} = dual(2, function mapValues<R, E, A>(ref: RefChunk<R, E, A>, f: (a: A, index: number) => A) {
  return ref.update(Chunk.map(f))
})

/**
 * Map the values with their indexes of a RefChunk.
 * @since 1.18.0
 * @category computed
 */
export const mapValues: {
  <A, B>(
    f: (a: A, index: number) => B
  ): <R, E>(ref: RefChunk<R, E, A>) => Computed.Computed<R, E, ReadonlyArray<B>>
  <R, E, A, B>(
    ref: RefChunk<R, E, A>,
    f: (a: A, index: number) => B
  ): Computed.Computed<R, E, ReadonlyArray<B>>
} = dual(
  2,
  function mapValues<R, E, A, B>(ref: RefChunk<R, E, A>, f: (a: A, index: number) => B) {
    return ref.map(Chunk.map(f))
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
  ): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    index: number,
    f: (a: A) => A
  ): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(3, function modifyAt<R, E, A>(ref: RefChunk<R, E, A>, index: number, f: (a: A) => A) {
  return ref.update(Chunk.modify(index, f))
})

/**
 * Partition the values of a RefChunk using a predicate.
 * @since 1.18.0
 * @category computed
 */
export const partition: {
  <A, B extends A>(
    predicate: (a: A) => a is B
  ): <R, E>(
    ref: RefChunk<R, E, A>
  ) => Computed.Computed<R, E, readonly [ReadonlyArray<B>, Chunk.Chunk<A>]>
  <R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean): Computed.Computed<
    never,
    E,
    readonly [Chunk.Chunk<A>, Chunk.Chunk<A>]
  >
} = dual(2, function partition<R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean) {
  return ref.map(Chunk.partition(predicate))
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
  ): <R, E>(ref: RefChunk<R, E, A>) => Computed.Computed<R, E, B>
  <R, E, A, B>(
    ref: RefChunk<R, E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): Computed.Computed<R, E, B>
} = dual(
  3,
  function reduce<R, E, A, B>(ref: RefChunk<R, E, A>, b: B, f: (b: B, a: A, index: number) => B) {
    return ref.map(Chunk.reduce(b, f))
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
  ): <R, E>(ref: RefChunk<R, E, A>) => Computed.Computed<R, E, B>
  <R, E, A, B>(
    ref: RefChunk<R, E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ): Computed.Computed<R, E, B>
} = dual(
  3,
  function reduceRight<R, E, A, B>(
    ref: RefChunk<R, E, A>,
    b: B,
    f: (b: B, a: A, index: number) => B
  ) {
    return ref.map(Chunk.reduceRight(b, f))
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
  ): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    index: number,
    a: A
  ): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(3, function replaceAt<R, E, A>(ref: RefChunk<R, E, A>, index: number, a: A) {
  return ref.update(Chunk.replace(index, a))
})

/**
 * Take the first `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const take: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function take<R, E, A>(ref: RefChunk<R, E, A>, n: number) {
  return ref.update(Chunk.take(n))
})

/**
 * Take the last `n` values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const takeRight: {
  (n: number): <R, E, A>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(ref: RefChunk<R, E, A>, n: number): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(2, function takeRight<R, E, A>(ref: RefChunk<R, E, A>, n: number) {
  return ref.update(Chunk.takeRight(n))
})

/**
 * Take values from a RefChunk while a predicate is true.
 * @since 1.18.0
 * @category combinators
 */
export const takeWhile: {
  <A>(
    predicate: (a: A) => boolean
  ): <R, E>(ref: RefChunk<R, E, A>) => Effect.Effect<R, E, Chunk.Chunk<A>>
  <R, E, A>(
    ref: RefChunk<R, E, A>,
    predicate: (a: A) => boolean
  ): Effect.Effect<R, E, Chunk.Chunk<A>>
} = dual(
  2,
  function takeWhile<R, E, A>(ref: RefChunk<R, E, A>, predicate: (a: A) => boolean) {
    return ref.update(Chunk.takeWhile(predicate))
  }
)

/**
 * Remove any duplicate values from a RefChunk.
 * @since 1.18.0
 * @category combinators
 */
export const dedupe = <R, E, A>(ref: RefChunk<R, E, A>): Effect.Effect<R, E, Chunk.Chunk<A>> => ref.update(Chunk.dedupe)