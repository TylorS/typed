import { Endomorphism } from 'fp-ts/Endomorphism'
import { flow, pipe } from 'fp-ts/function'
import * as F from 'fp-ts/Functor'
import { none, Option, some } from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'

import { FiberRefOptions } from '@/FiberRef'
import * as Fx from '@/Fx'
import * as Ref from '@/Ref'

export interface RefArray<R, E, A, Input = readonly A[]>
  extends Ref.Ref<R, E, Input, readonly A[]> {}

/**
 * Construct a RefArray that starts with an empty Array
 */
export const empty = <A>(options?: FiberRefOptions<readonly A[]>): RefArray<unknown, never, A> =>
  Ref.make(Fx.of<readonly A[]>([]), options)

/**
 * Apply a transformation to the Output values of a RefArray.
 */
export const map = F.map(Ref.Functor, RA.Functor) as <A, B>(
  f: (a: A) => B,
) => <R, E, I>(fa: RefArray<R, E, A, I>) => RefArray<R, E, B, I>

/**
 * Applies an Endomorphism to the underlying Array changing the underlying state.
 */
export const mapInput =
  <A>(f: Endomorphism<A>) =>
  <R, E>(ra: RefArray<R, E, A>): Fx.Fx<R, E, readonly A[]> =>
    ra.update(flow(RA.map(f), Fx.of))

/**
 * Append a value to the end of a RefArray
 */
export const append =
  <A>(value: A) =>
  <R, E>(ra: RefArray<R, E, A>): Fx.Fx<R, E, readonly A[]> =>
    ra.update((as) => Fx.of([...as, value]))

/**
 * Prepend a value to the end of a RefArray
 */
export const prepend =
  <A>(value: A) =>
  <R, E>(ra: RefArray<R, E, A>): Fx.Fx<R, E, readonly A[]> =>
    ra.update((as) => Fx.of([value, ...as]))

/**
 * Unshift a value from the front of the RefArray
 */
export const unshift = <R, E, A>(ra: RefArray<R, E, A>): Fx.Fx<R, E, Option<A>> =>
  Fx.Fx(function* () {
    const values = yield* ra.get

    if (values.length === 0) {
      return none
    }

    const [first, ...rest] = values

    yield* ra.update(() => Fx.of(rest))

    return some(first)
  })

/**
 * Pop a value from the end of the RefArray
 */
export const pop = <R, E, A>(ra: RefArray<R, E, A>): Fx.Fx<R, E, Option<A>> =>
  Fx.Fx(function* () {
    const values = yield* ra.get

    if (values.length === 0) {
      return none
    }

    const lastIndex = values.length - 1

    yield* ra.update(() => Fx.of(values.slice(0, lastIndex)))

    return some(values[lastIndex])
  })

export const size = <R, E, A, I>(ra: RefArray<R, E, A, I>) => pipe(ra.get, Fx.map(RA.size))
