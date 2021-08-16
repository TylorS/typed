/**
 * RefArray is a collection of helpers for working with Refs that manage an array.
 * @since 0.11.0
 */
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Predicate } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'

import * as E from './Env'
import { flow, pipe } from './function'
import * as Ref from './Ref'

/**
 * RefArray is an abstraction of Refs that will track an array of values.
 * @since 0.11.0
 * @category Model
 */
export interface RefArray<E, A> extends Ref.Ref<E, readonly A[]> {}

/**
 * @since 0.11.0
 * @category Combinator
 */
export const append =
  <A>(value: A) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.append(value), E.of))

/**
 * @since 0.12.0
 * @category Combinator
 */
export const concat =
  <A>(end: ReadonlyArray<A>) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.concat(end), E.of))

/**
 * @since 0.14.0
 * @category Combinator
 */
export const deleteAt =
  (index: number) =>
  <E, A>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.deleteAt(index),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const filter =
  <A>(p: Predicate<A>) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.filter(p), E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const insertAt =
  <A>(index: number, value: A) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.insertAt(index, value),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const modifyAt =
  <A>(index: number, f: Endomorphism<A>) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.modifyAt(index, f),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const prepend =
  <A>(value: A) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.prepend(value), E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const reverse = <E, A>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
  ra.update(flow(RA.reverse, E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const rotate =
  (n: number) =>
  <E, A>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.rotate(n), E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const sort =
  <A>(O: Ord<A>) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.sort(O), E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const sortBy =
  <A>(O: readonly Ord<A>[]) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.sortBy(O), E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const uniq =
  <A>(Eq: Eq<A>) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.uniq(Eq), E.of))

/**
 * @since 0.11.0
 * @category Combinator
 */
export const updateAt =
  <A>(index: number, a: A) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.updateAt(index, a),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.11.0
 * @category Combinator
 */
export const endoMap =
  <A>(f: Endomorphism<A>) =>
  <E>(ra: RefArray<E, A>): E.Env<E, readonly A[]> =>
    ra.update(flow(RA.map(f), E.of))
