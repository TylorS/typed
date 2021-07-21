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

export interface RefArray<E, A> extends Ref.Wrapped<E, ReadonlyArray<A>> {
  readonly memberEq: Eq<A>
}

/**
 * Helps to lift a Ref into a RefArray with a memberEq
 */
export const lift =
  <A>(memberEq: Eq<A>) =>
  <E>(ref: Ref.Wrapped<E, ReadonlyArray<A>>): RefArray<E, A> => ({ ...ref, memberEq })

/* Modifies the underlying State */

export const append =
  <E, A>(ra: RefArray<E, A>) =>
  (value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.append(value), E.of))

export const concat =
  <E, A>(ra: RefArray<E, A>) =>
  (end: ReadonlyArray<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.concat(end), E.of))

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

export const filter =
  <E, A>(ra: RefArray<E, A>) =>
  (p: Predicate<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.filter(p), E.of))

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

export const prepend =
  <E, A>(ra: RefArray<E, A>) =>
  (value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.prepend(value), E.of))

export const reverse = <E, A>(ra: RefArray<E, A>): E.Env<E & Ref.Refs, readonly A[]> =>
  ra.update(flow(RA.reverse, E.of))

export const rotate =
  <E, A>(ra: RefArray<E, A>) =>
  (n: number): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.rotate(n), E.of))

export const sort =
  <E, A>(ra: RefArray<E, A>) =>
  (O: Ord<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.sort(O), E.of))

export const sortBy =
  <E, A>(ra: RefArray<E, A>) =>
  (O: readonly Ord<A>[]): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.sortBy(O), E.of))

export const uniq =
  <E, A>(ra: RefArray<E, A>) =>
  (Eq: Eq<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.uniq(Eq), E.of))

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

export const endoMap =
  <E, A>(ra: RefArray<E, A>) =>
  (f: Endomorphism<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.map(f), E.of))

export interface Wrapped<E, A> extends RefArray<E, A> {
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

export function wrap<E, A>(M: RefArray<E, A>): Wrapped<E, A> {
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

export const create = <A>(
  memberEq: Eq<A>,
): (<E>(ref: Ref.Wrapped<E, ReadonlyArray<A>>) => Wrapped<E, A>) => flow(lift(memberEq), wrap)

export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
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

export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(ref: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
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

export const provideAll: <E>(provided: E) => <A>(ref: Wrapped<E, A>) => Wrapped<unknown, A> =
  provideSome

export const useAll: <E>(provided: E) => <A>(ref: Wrapped<E, A>) => Wrapped<unknown, A> = useSome

export const WrappedURI = '@typed/fp/RefArray'
export type WrappedURI = typeof WrappedURI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [WrappedURI]: Wrapped<E, A>
  }
}

export const UseSome: P.UseSome2<WrappedURI> = {
  useSome,
}

export const UseAll: P.UseAll2<WrappedURI> = {
  useAll,
}

export const ProvideSome: P.ProvideSome2<WrappedURI> = {
  provideSome,
}

export const ProvideAll: P.ProvideAll2<WrappedURI> = {
  provideAll,
}

export const Provide: P.Provide2<WrappedURI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
