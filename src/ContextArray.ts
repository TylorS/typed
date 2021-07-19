import * as C from '@fp/Context'
import * as E from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import * as P from '@fp/Provide'
import * as Ref from '@fp/Ref'
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import { flow, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Predicate } from 'fp-ts/Predicate'
import * as RA from 'fp-ts/ReadonlyArray'

export interface ContextArray<E, A> extends C.Context<E, ReadonlyArray<A>> {
  readonly memberEq: Eq<A>
}

export type ContextArrayOptions<A> = Ref.RefOptions<ReadonlyArray<A>> & {
  readonly memberEq?: Eq<A>
}

export const make = <E, A>(
  initial: E.Env<E, ReadonlyArray<A>>,
  options: ContextArrayOptions<A> = {},
): ContextArray<E, A> => {
  const { id, memberEq = deepEqualsEq, eq = RA.getEq(memberEq) } = options
  const Context = C.create(initial, { id, eq })

  return {
    ...Context,
    memberEq,
  }
}

export const of = <A>(memberEq: Eq<A> = deepEqualsEq) =>
  create(
    E.fromIO(() => []),
    { memberEq },
  )

/* Modifies the underlying State */

export const append =
  <E, A>(ra: ContextArray<E, A>) =>
  (value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.append(value), E.of))

export const concat =
  <E, A>(ra: ContextArray<E, A>) =>
  (end: ReadonlyArray<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.concat(end), E.of))

export const deleteAt =
  <E, A>(ra: ContextArray<E, A>) =>
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
  <E, A>(ra: ContextArray<E, A>) =>
  (p: Predicate<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.filter(p), E.of))

export const insertAt =
  <E, A>(ra: ContextArray<E, A>) =>
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
  <E, A>(ra: ContextArray<E, A>) =>
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
  <E, A>(ra: ContextArray<E, A>) =>
  (value: A): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.prepend(value), E.of))

export const reverse = <E, A>(ra: ContextArray<E, A>): E.Env<E & Ref.Refs, readonly A[]> =>
  ra.update(flow(RA.reverse, E.of))

export const rotate =
  <E, A>(ra: ContextArray<E, A>) =>
  (n: number): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.rotate(n), E.of))

export const sort =
  <E, A>(ra: ContextArray<E, A>) =>
  (O: Ord<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.sort(O), E.of))

export const sortBy =
  <E, A>(ra: ContextArray<E, A>) =>
  (O: readonly Ord<A>[]): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.sortBy(O), E.of))

export const uniq =
  <E, A>(ra: ContextArray<E, A>) =>
  (Eq: Eq<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.uniq(Eq), E.of))

export const updateAt =
  <E, A>(ra: ContextArray<E, A>) =>
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
  <E, A>(ra: ContextArray<E, A>) =>
  (f: Endomorphism<A>): E.Env<E & Ref.Refs, readonly A[]> =>
    ra.update(flow(RA.map(f), E.of))

export interface Wrapped<E, A> extends ContextArray<E, A> {
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

export function wrap<E, A>(M: ContextArray<E, A>): Wrapped<E, A> {
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

export const create = flow(make, wrap)

export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(Context: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
    const provide = E.useSome(provided)

    return {
      ...Ref.useSome(provided)(Context),
      memberEq: Context.memberEq,
      append: flow(Context.append, provide),
      concat: flow(Context.concat, provide),
      deleteAt: flow(Context.deleteAt, provide),
      endoMap: flow(Context.endoMap, provide),
      filter: flow(Context.filter, provide),
      insertAt: flow(Context.insertAt, provide),
      modifyAt: flow(Context.modifyAt, provide),
      prepend: flow(Context.prepend, provide),
      reverse: provide(Context.reverse),
      rotate: flow(Context.rotate, provide),
      sort: flow(Context.sort, provide),
      sortBy: flow(Context.sortBy, provide),
      uniq: flow(Context.uniq, provide),
      updateAt: flow(Context.updateAt, provide),
    }
  }

export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(Context: Wrapped<E1 & E2, A>): Wrapped<E2, A> => {
    const provide = E.provideSome(provided)

    return {
      ...Ref.useSome(provided)(Context),
      memberEq: Context.memberEq,
      append: flow(Context.append, provide),
      concat: flow(Context.concat, provide),
      deleteAt: flow(Context.deleteAt, provide),
      endoMap: flow(Context.endoMap, provide),
      filter: flow(Context.filter, provide),
      insertAt: flow(Context.insertAt, provide),
      modifyAt: flow(Context.modifyAt, provide),
      prepend: flow(Context.prepend, provide),
      reverse: provide(Context.reverse),
      rotate: flow(Context.rotate, provide),
      sort: flow(Context.sort, provide),
      sortBy: flow(Context.sortBy, provide),
      uniq: flow(Context.uniq, provide),
      updateAt: flow(Context.updateAt, provide),
    }
  }

export const provideAll: <E>(provided: E) => <A>(Context: Wrapped<E, A>) => Wrapped<unknown, A> =
  provideSome

export const useAll: <E>(provided: E) => <A>(Context: Wrapped<E, A>) => Wrapped<unknown, A> =
  useSome

export const WrappedURI = '@typed/fp/ContextArray'
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
