/**
 * RefMap is an abstraction over [Ref](./Ref.ts.md) to provide additional functionality for
 * working with ReadonlyMap
 * @since 0.9.2
 */
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Predicate } from 'fp-ts/Predicate'
import * as RM from 'fp-ts/ReadonlyMap'
import { Refinement } from 'fp-ts/Refinement'

import * as E from './Env'
import * as P from './Provide'
import * as Ref from './Ref'

/**
 * @since 0.9.2
 * @category Model
 */
export interface RefMap<E, K, V> extends Ref.Reference<E, ReadonlyMap<K, V>> {
  readonly keyEq: Eq<K>
  readonly valueEq: Eq<V>
}

/**
 * Helps to lift a Reference value into a RefMap
 * @since 0.9.2
 * @category Constructor
 */
export const lift =
  <K, V>(keyEq: Eq<K>, valueEq: Eq<V>) =>
  <E>(ref: Ref.Reference<E, ReadonlyMap<K, V>>): RefMap<E, K, V> => ({ ...ref, keyEq, valueEq })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrCreate = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const find = RM.lookup(M.keyEq)
  const upsert = RM.upsertAt(M.keyEq)

  return <E2>(k: K, orCreate: E.Env<E2, V>) =>
    pipe(
      E.Do,
      E.bindW('map', () => M.get),
      E.bindW('current', ({ map }) => pipe(map, find(k), E.of)),
      E.chainW(({ map, current }) =>
        pipe(
          current,
          O.matchW(
            () =>
              pipe(
                orCreate,
                E.chainFirstW((a) => pipe(map, upsert(k, a), M.set)),
              ),
            E.of,
          ),
        ),
      ),
    )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const upsertAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const upsert = RM.upsertAt(M.keyEq)

  return (k: K, v: V) => M.update(flow(upsert(k, v), E.of))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const lookup = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const find = RM.lookup(M.keyEq)

  return (k: K) => pipe(M.get, E.map(find(k)))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const deleteAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const del = RM.deleteAt(M.keyEq)

  return (k: K) =>
    M.update((current) =>
      pipe(
        current,
        del(k),
        O.matchW(() => current, identity),
        E.of,
      ),
    )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const elem = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const find = RM.elem(M.valueEq)

  return (v: V) => pipe(M.get, E.map(find(v)))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const filter = <E1, K, V>(M: RefMap<E1, K, V>) => {
  function filterM<V2 extends V>(r: Refinement<V, V2>): E.Env<E1 & Ref.Refs, ReadonlyMap<K, V>>
  function filterM(r: Predicate<V>): E.Env<E1 & Ref.Refs, ReadonlyMap<K, V>>
  function filterM(r: Predicate<V>): E.Env<E1 & Ref.Refs, ReadonlyMap<K, V>> {
    return pipe(M.get, E.map(RM.filter(r)), E.chainW(M.set))
  }

  return filterM
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const insertAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const insert = RM.insertAt(M.keyEq)

  return (k: K, v: V) =>
    M.update((m) =>
      pipe(
        m,
        insert(k, v),
        O.getOrElse(() => m),
        E.of,
      ),
    )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const modifyAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const modify = RM.modifyAt(M.keyEq)

  return (k: K, v: Endomorphism<V>) =>
    M.update((m) =>
      pipe(
        m,
        modify(k, v),
        O.getOrElse(() => m),
        E.of,
      ),
    )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const updateAt = <E1, K, V>(M: RefMap<E1, K, V>) => {
  const update = RM.updateAt(M.keyEq)

  return (k: K, v: V) =>
    M.update((m) =>
      pipe(
        m,
        update(k, v),
        O.getOrElse(() => m),
        E.of,
      ),
    )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const keys =
  <K>(O: Ord<K>) =>
  <E, V>(M: RefMap<E, K, V>) =>
    pipe(M.get, E.map(RM.keys(O)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const size = <E, K, V>(M: RefMap<E, K, V>) => pipe(M.get, E.map(RM.size))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const toReadonlyArray =
  <K>(O: Ord<K>) =>
  <E, V>(M: RefMap<E, K, V>) =>
    pipe(M.get, E.map(RM.toReadonlyArray(O)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const values =
  <V>(O: Ord<V>) =>
  <E, K>(M: RefMap<E, K, V>) =>
    pipe(M.get, E.map(RM.values(O)))

/**
 * @since 0.9.2
 * @category Model
 */
export interface ReferenceMap<E, K, V> extends RefMap<E, K, V> {
  readonly getOrCreate: <E2>(k: K, orCreate: E.Env<E2, V>) => E.Env<E & E2 & Ref.Refs, V>
  readonly upsertAt: (k: K, v: V) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly lookup: (k: K) => E.Env<E & Ref.Refs, O.Option<V>>
  readonly elem: (v: V) => E.Env<E & Ref.Refs, boolean>
  readonly filter: {
    <V2 extends V>(r: Refinement<V, V2>): E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
    (r: Predicate<V>): E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  }
  readonly insertAt: (k: K, v: V) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly updateAt: (k: K, v: V) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly modifyAt: (k: K, v: Endomorphism<V>) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
  readonly deleteAt: (k: K) => E.Env<E & Ref.Refs, ReadonlyMap<K, V>>
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export function toReferenceMap<E, K, V>(M: RefMap<E, K, V>): ReferenceMap<E, K, V> {
  return {
    ...M,
    getOrCreate: getOrCreate(M),
    upsertAt: upsertAt(M),
    lookup: lookup(M),
    elem: elem(M),
    filter: filter(M),
    insertAt: insertAt(M),
    modifyAt: modifyAt(M),
    updateAt: updateAt(M),
    deleteAt: deleteAt(M),
  }
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const create = <K, V>(
  keyEq: Eq<K>,
  valueEq: Eq<V>,
): (<E>(ref: Ref.Reference<E, ReadonlyMap<K, V>>) => ReferenceMap<E, K, V>) =>
  flow(lift(keyEq, valueEq), toReferenceMap)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <E1>(provided: E1) =>
  <E2, K, V>(ref: ReferenceMap<E1 & E2, K, V>): ReferenceMap<E2, K, V> => {
    const provide = E.useSome(provided)

    return {
      ...Ref.useSome(provided)(ref),
      keyEq: ref.keyEq,
      valueEq: ref.valueEq,
      getOrCreate: flow(ref.getOrCreate, provide),
      upsertAt: flow(ref.upsertAt, provide),
      lookup: flow(ref.lookup, provide),
      elem: flow(ref.elem, provide),
      filter: flow(ref.filter, provide),
      insertAt: flow(ref.insertAt, provide),
      modifyAt: flow(ref.modifyAt, provide),
      updateAt: flow(ref.updateAt, provide),
      deleteAt: flow(ref.deleteAt, provide),
    }
  }

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <E1>(provided: E1) =>
  <E2, K, V>(ref: ReferenceMap<E1 & E2, K, V>): ReferenceMap<E2, K, V> => {
    const provide = E.provideSome(provided)

    return {
      ...Ref.provideSome(provided)(ref),
      keyEq: ref.keyEq,
      valueEq: ref.valueEq,
      getOrCreate: flow(ref.getOrCreate, provide),
      upsertAt: flow(ref.upsertAt, provide),
      lookup: flow(ref.lookup, provide),
      elem: flow(ref.elem, provide),
      filter: flow(ref.filter, provide),
      insertAt: flow(ref.insertAt, provide),
      modifyAt: flow(ref.modifyAt, provide),
      updateAt: flow(ref.updateAt, provide),
      deleteAt: flow(ref.deleteAt, provide),
    }
  }

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll: <E>(
  provided: E,
) => <K, V>(ref: ReferenceMap<E, K, V>) => ReferenceMap<unknown, K, V> = provideSome

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll: <E>(
  provided: E,
) => <K, V>(ref: ReferenceMap<E, K, V>) => ReferenceMap<unknown, K, V> = useSome

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ReferenceMap'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: ReferenceMap<R, E, A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: P.UseSome3<URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: P.UseAll3<URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: P.ProvideSome3<URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: P.ProvideAll3<URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide3<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
