/**
 * RefArray is an abstraction over [Ref](./Ref.ts.md) to
 * provide some additional functionality for working with Arrays.
 * @since 0.9.2
 */
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Predicate } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'

import * as E from './Env'
import * as P from './Provide'
import * as Ref from './Ref'

/**
 * @since 0.9.2
 * @category Model
 */
export interface RefArray<E, A> extends Ref.Reference<E, ReadonlyArray<A>> {
  readonly memberEq: Eq<A>
}

/**
 * Helps to lift a Ref into a RefArray with a memberEq
 */
/**
 * @since 0.9.2
 * @category Constructor
 */
export const lift =
  <A>(memberEq: Eq<A>) =>
  <E>(ref: Ref.Reference<E, ReadonlyArray<A>>): RefArray<E, A> => ({ ...ref, memberEq })

/* Modifies the underlying State */

/**
 * @since 0.9.2
 * @category Combinator
 */
export const append =
  <E, A>(ra: RefArray<E, A>) =>
  (value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.append(value), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const concat =
  <E, A>(ra: RefArray<E, A>) =>
  (end: ReadonlyArray<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.concat(end), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const deleteAt =
  <E, A>(ra: RefArray<E, A>) =>
  (index: number): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.deleteAt(index),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const filter =
  <E, A>(ra: RefArray<E, A>) =>
  (p: Predicate<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.filter(p), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const insertAt =
  <E, A>(ra: RefArray<E, A>) =>
  (index: number, value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.insertAt(index, value),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const modifyAt =
  <E, A>(ra: RefArray<E, A>) =>
  (index: number, f: Endomorphism<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.modifyAt(index, f),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const prepend =
  <E, A>(ra: RefArray<E, A>) =>
  (value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.prepend(value), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const reverse = <E, A>(ra: RefArray<E, A>): E.Env<E & Ref.Refs, readonly A[]> =>
  ra.update(flow(RA.reverse, E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const rotate =
  <E, A>(ra: RefArray<E, A>) =>
  (n: number): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.rotate(n), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const sort =
  <E, A>(ra: RefArray<E, A>) =>
  (O: Ord<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.sort(O), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const sortBy =
  <E, A>(ra: RefArray<E, A>) =>
  (O: readonly Ord<A>[]): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.sortBy(O), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const uniq =
  <E, A>(ra: RefArray<E, A>) =>
  (Eq: Eq<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.uniq(Eq), E.of))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const updateAt =
  <E, A>(ra: RefArray<E, A>) =>
  (index: number, a: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update((list) =>
      pipe(
        list,
        RA.updateAt(index, a),
        O.getOrElse(() => list),
        E.of,
      ),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const endoMap =
  <E, A>(ra: RefArray<E, A>) =>
  (f: Endomorphism<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.map(f), E.of))

/**
 * @since 0.9.2
 * @category Model
 */
export interface ReferenceArray<E, A> extends RefArray<E, A> {
  readonly append: (value: A) => E.Env<E & Ref.Refs, readonly A[]>
  readonly concat: (end: ReadonlyArray<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly deleteAt: (index: number) => E.Env<E & Ref.Refs, readonly A[]>
  readonly endoMap: (f: Endomorphism<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly filter: (p: Predicate<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly insertAt: (index: number, value: A) => E.Env<E & Ref.Refs, readonly A[]>
  readonly modifyAt: (index: number, f: Endomorphism<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly prepend: (value: A) => E.Env<E & Ref.Refs, readonly A[]>
  readonly reverse: E.Env<E & Ref.Refs, readonly A[]>
  readonly rotate: (n: number) => E.Env<E & Ref.Refs, readonly A[]>
  readonly sort: (O: Ord<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly sortBy: (Ors: readonly Ord<A>[]) => E.Env<E & Ref.Refs, readonly A[]>
  readonly uniq: (E: Eq<A>) => E.Env<E & Ref.Refs, readonly A[]>
  readonly updateAt: (index: number, a: A) => E.Env<E & Ref.Refs, readonly A[]>
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export function toReferenceArray<E, A>(M: RefArray<E, A>): ReferenceArray<E, A> {
  return {
    ...M,
    append: append(M),
    concat: concat(M),
    deleteAt: deleteAt(M),
    endoMap: endoMap(M),
    filter: filter(M),
    insertAt: insertAt(M),
    modifyAt: modifyAt(M),
    prepend: prepend(M),
    reverse: reverse(M),
    rotate: rotate(M),
    sort: sort(M),
    sortBy: sortBy(M),
    uniq: uniq(M),
    updateAt: updateAt(M),
  }
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const create = <A>(
  memberEq: Eq<A>,
): (<E>(ref: Ref.Reference<E, ReadonlyArray<A>>) => ReferenceArray<E, A>) =>
  flow(lift(memberEq), toReferenceArray)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: ReferenceArray<E1 & E2, A>): ReferenceArray<E2, A> => {
    const provide = E.useSome(provided)

    return {
      ...Ref.useSome(provided)(ref),
      memberEq: ref.memberEq,
      append: flow(ref.append, provide),
      concat: flow(ref.concat, provide),
      deleteAt: flow(ref.deleteAt, provide),
      endoMap: flow(ref.endoMap, provide),
      filter: flow(ref.filter, provide),
      insertAt: flow(ref.insertAt, provide),
      modifyAt: flow(ref.modifyAt, provide),
      prepend: flow(ref.prepend, provide),
      reverse: provide(ref.reverse),
      rotate: flow(ref.rotate, provide),
      sort: flow(ref.sort, provide),
      sortBy: flow(ref.sortBy, provide),
      uniq: flow(ref.uniq, provide),
      updateAt: flow(ref.updateAt, provide),
    }
  }

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: ReferenceArray<E1 & E2, A>): ReferenceArray<E2, A> => {
    const provide = E.provideSome(provided)

    return {
      ...Ref.useSome(provided)(ref),
      memberEq: ref.memberEq,
      append: flow(ref.append, provide),
      concat: flow(ref.concat, provide),
      deleteAt: flow(ref.deleteAt, provide),
      endoMap: flow(ref.endoMap, provide),
      filter: flow(ref.filter, provide),
      insertAt: flow(ref.insertAt, provide),
      modifyAt: flow(ref.modifyAt, provide),
      prepend: flow(ref.prepend, provide),
      reverse: provide(ref.reverse),
      rotate: flow(ref.rotate, provide),
      sort: flow(ref.sort, provide),
      sortBy: flow(ref.sortBy, provide),
      uniq: flow(ref.uniq, provide),
      updateAt: flow(ref.updateAt, provide),
    }
  }

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll: <E>(
  provided: E,
) => <A>(ref: ReferenceArray<E, A>) => ReferenceArray<unknown, A> = provideSome

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll: <E>(
  provided: E,
) => <A>(ref: ReferenceArray<E, A>) => ReferenceArray<unknown, A> = useSome

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ReferenceArray'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReferenceArray<E, A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: P.UseSome2<URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: P.UseAll2<URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
