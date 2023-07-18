import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Order from '@effect/data/Order'
import * as ReadonlyArray from '@effect/data/ReadonlyArray'
import * as Equivalence from '@effect/data/Equivalence'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import fastDeepEqual from 'fast-deep-equal/es6'

import { Computed } from './Computed.js'
import { RefSubject, makeRef } from './RefSubject.js'

export interface RefArray<E, A> extends RefSubject<E, readonly A[]> {
  /**
   * Append values to the end of the array contained within the RefSubject
   */
  readonly append: (...as: readonly A[]) => Effect.Effect<never, E, readonly A[]>

  /**
   * Returns true if the array contains the given value.
   */
  readonly contains: (a: A) => Effect.Effect<never, E, boolean>

  /**
   * Drops the first `n` values from the array contained within the RefSubject
   */
  readonly drop: (n: number) => Effect.Effect<never, E, readonly A[]>

  /**
   * Drops the last `n` values from the array contained within the RefSubject
   */
  readonly dropRight: (n: number) => Effect.Effect<never, E, readonly A[]>

  /**
   * Drops values from the array contained within the RefSubject as long as the predicate returns true
   */
  readonly dropWhile: (predicate: (a: A) => boolean) => Effect.Effect<never, E, readonly A[]>

  /**
   * Filter the values contained within the RefSubject.
   */
  readonly filterValues: (
    predicate: (a: A, index: number) => boolean,
  ) => Effect.Effect<never, E, readonly A[]>

  /**
   * Retrieve the value at a given index from the array contained within the RefSubject.
   */
  readonly getIndex: (index: number) => Effect.Effect<never, E, Option.Option<A>>

  /**
   * Creates a computed value which will group the values contained within the RefSubject by the given function.
   */
  readonly groupBy: (f: (a: A) => string) => Computed<never, E, Record<string, readonly A[]>>

  /**
   * Insert a value at the given index into the array contained within the RefSubject.
   */
  readonly insertAt: (index: number, a: A) => Effect.Effect<never, E, readonly A[]>

  /**
   * A Computed value which will be true if the array contained within the RefSubject is empty.
   */
  readonly isEmpty: Computed<never, E, boolean>

  /**
   * A Computed value which will be true if the array contained within the RefSubject is not empty.
   */
  readonly isNonEmpty: Computed<never, E, boolean>

  /**
   * A Computed value which will be true if the array contained within the RefSubject is not empty.
   */
  readonly length: Computed<never, E, number>

  /**
   * Map the values of the array contained within the RefSubject into a Computed value which will
   * always be kept up-to-date.
   */
  readonly mapValues: <B>(f: (a: A, index: number) => B) => Computed<never, E, readonly B[]>

  /**
   * Modify the value at a given index in the array contained within the RefSubject.
   */
  readonly modifyAt: (index: number, f: (a: A) => A) => Effect.Effect<never, E, readonly A[]>

  /**
   * Split the array contained within the RefSubject into two arrays, one which contains the values
   * which satisfy the predicate and one which contains the values which do not.
   */
  readonly partition: (
    predicate: (a: A, index: number) => boolean,
  ) => Computed<never, E, readonly [readonly A[], readonly A[]]>

  /**
   * Prepend values to the beginning of the array contained within the RefSubject
   */
  readonly prepend: (...as: readonly A[]) => Effect.Effect<never, E, readonly A[]>

  /**
   * Reduce the values contained within the RefSubject into a single value returning a Computed
   * which will always be kept up-to-date.
   */
  readonly reduce: <B>(b: B, f: (b: B, a: A, index: number) => B) => Computed<never, E, B>

  /**
   * Reduce the values, from last index to first, contained within the RefSubject into a single value returning a Computed
   * which will always be kept up-to-date.
   */
  readonly reduceRight: <B>(b: B, f: (b: B, a: A, index: number) => B) => Computed<never, E, B>

  /**
   * Replace the value at a given index in the array contained within the RefSubject.
   */
  readonly replaceAt: (index: number, a: A) => Effect.Effect<never, E, readonly A[]>

  /**
   * Rotate the values in the array contained within the RefSubject by the given number of places.
   * Very helpful for carousel-like functionality.
   */
  readonly rotate: (n: number) => Effect.Effect<never, E, readonly A[]>

  /**
   * Sort the values in the array contained within the RefSubject by the given ordering.
   */
  readonly sortBy: (...orders: Order.Order<A>[]) => Effect.Effect<never, E, readonly A[]>

  /**
   * Take the first `n` values from the array contained within the RefSubject
   */
  readonly take: (n: number) => Effect.Effect<never, E, readonly A[]>

  /**
   * Take the last `n` values from the array contained within the RefSubject
   */
  readonly takeRight: (n: number) => Effect.Effect<never, E, readonly A[]>

  /**
   * Take values from the array contained within the RefSubject as long as the predicate returns true
   */
  readonly takeWhile: (predicate: (a: A) => boolean) => Effect.Effect<never, E, readonly A[]>

  /**
   * Removes any duplicates held within the array contained within the RefSubject.
   */
  readonly dedupe: Effect.Effect<never, E, readonly A[]>
}

export function makeRefArray<R, E, A>(
  initial: Effect.Effect<R, E, readonly A[]>,
  eq: Equivalence.Equivalence<A> = fastDeepEqual,
): Effect.Effect<R | Scope.Scope, never, RefArray<E, A>> {
  return Effect.gen(function* ($) {
    const arrayEq = Equivalence.array(eq)
    const ref = yield* $(makeRef(initial, arrayEq))
    const isEmpty = ref.map(ReadonlyArray.isEmptyReadonlyArray)
    const isNonEmpty = ref.map(ReadonlyArray.isNonEmptyReadonlyArray)
    const length = ref.map(ReadonlyArray.length)
    const getIndex = (index: number) => ref.map(ReadonlyArray.get(index))
    const prepend = (...as: readonly A[]) => ref.update(ReadonlyArray.prependAll(as))
    const append = (...as: readonly A[]) => ref.update(ReadonlyArray.appendAll(as))
    const insertAt = (index: number, a: A) =>
      ref.update((as) =>
        pipe(
          as,
          ReadonlyArray.insertAt(index, a),
          Option.getOrElse(() => as),
        ),
      )
    const replaceAt = (index: number, a: A) =>
      ref.update((as) => pipe(as, ReadonlyArray.replace(index, a)))
    const modifyAt = (index: number, f: (a: A) => A) => ref.update(ReadonlyArray.modify(index, f))
    const take = (n: number) => ref.update(ReadonlyArray.take(n))
    const takeRight = (n: number) => ref.update(ReadonlyArray.takeRight(n))
    const drop = (n: number) => ref.update(ReadonlyArray.drop(n))
    const dropRight = (n: number) => ref.update(ReadonlyArray.dropRight(n))
    const takeWhile = (predicate: (a: A) => boolean) =>
      ref.update(ReadonlyArray.takeWhile(predicate))
    const dropWhile = (predicate: (a: A) => boolean) =>
      ref.update(ReadonlyArray.dropWhile(predicate))
    const sortBy = (...orders: Order.Order<A>[]) => ref.update(ReadonlyArray.sortBy<A>(...orders))
    const rotate = (n: number) => ref.update(ReadonlyArray.rotate(n))
    const contains_ = ReadonlyArray.containsWith(eq)
    const contains = (a: A) => ref.map<boolean>(contains_(a))
    const dedupe = ref.update(ReadonlyArray.dedupeWith(eq))
    const groupBy = (f: (a: A) => string) => ref.map(ReadonlyArray.groupBy(f))
    const filterValues = (predicate: (a: A, index: number) => boolean) =>
      ref.update(ReadonlyArray.filter(predicate))
    const partition = (predicate: (a: A, index: number) => boolean) =>
      ref.map(ReadonlyArray.partition(predicate))

    const mapValues = <B>(f: (a: A, index: number) => B) => ref.map(ReadonlyArray.map(f))
    const reduce = <B>(b: B, f: (b: B, a: A, index: number) => B) =>
      ref.map(ReadonlyArray.reduce(b, f))
    const reduceRight = <B>(b: B, f: (b: B, a: A, index: number) => B) =>
      ref.map(ReadonlyArray.reduceRight(b, f))

    return Object.assign(ref, {
      append,
      contains,
      drop,
      dropRight,
      dropWhile,
      filterValues,
      getIndex,
      groupBy,
      insertAt,
      isEmpty,
      isNonEmpty,
      length,
      mapValues,
      modifyAt,
      partition,
      prepend,
      reduce,
      reduceRight,
      replaceAt,
      rotate,
      sortBy,
      take,
      takeRight,
      takeWhile,
      dedupe,
    })
  })
}
