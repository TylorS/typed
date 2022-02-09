import { FiberRefOptions } from '@/FiberRef'
import * as Fx from '@/Fx'
import { Endomorphism } from '@/Prelude/Endomorphism'
import { flow, pipe } from '@/Prelude/function'
import * as F from '@/Prelude/Functor'
import { None, Option, Some } from '@/Prelude/Option'
import * as RA from '@/Prelude/ReadonlyArray'
import * as Ref from '@/Ref'

export interface RefArray<R, E, A, I = readonly A[]> extends Ref.Ref<R, E, I, readonly A[]> {}

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
      return None
    }

    const [first, ...rest] = values

    yield* ra.update(() => Fx.of(rest))

    return Some(first)
  })

/**
 * Pop a value from the end of the RefArray
 */
export const pop = <R, E, A>(ra: RefArray<R, E, A>): Fx.Fx<R, E, Option<A>> =>
  Fx.Fx(function* () {
    const values = yield* ra.get

    if (values.length === 0) {
      return None
    }

    const lastIndex = values.length - 1

    yield* ra.update(() => Fx.of(values.slice(0, lastIndex)))

    return Some(values[lastIndex])
  })

export const size = <R, E, A>(ra: RefArray<R, E, A>) => pipe(ra.get, Fx.map(RA.size))
