import * as E from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import * as P from '@fp/Provide'
import * as Ref from '@fp/Ref'
import { Endomorphism } from 'fp-ts/Endomorphism'
import { Eq } from 'fp-ts/Eq'
import { flow, identity, pipe } from 'fp-ts/function'
import * as O from 'fp-ts/Option'
import { Ord } from 'fp-ts/Ord'
import { Predicate } from 'fp-ts/Predicate'
import * as RM from 'fp-ts/ReadonlyMap'
import { Refinement } from 'fp-ts/Refinement'

export interface RefMapM<E, K, V> extends Ref.Wrapped<E, Map<K, V>> {
  readonly keyEq: Eq<K>
  readonly valueEq: Eq<V>
}

export type RefMapMOptions<K, V> = Ref.RefOptions<Map<K, V>> & {
  readonly keyEq?: Eq<K>
  readonly valueEq?: Eq<V>
}

export const make = <E, K, V>(
  initial: E.Env<E, Map<K, V>>,
  options: RefMapMOptions<K, V> = {},
): RefMapM<E, K, V> => {
  const {
    id,
    keyEq = deepEqualsEq,
    valueEq = deepEqualsEq,
    eq = RM.getEq(keyEq, valueEq),
  } = options

  const ref = Ref.create(initial, { id, eq })

  return {
    ...ref,
    keyEq,
    valueEq,
  }
}

export const getOrCreate = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const find = RM.lookup(M.keyEq)

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
                E.map((a) => (map.set(k, a), a)),
              ),
            E.of,
          ),
        ),
      ),
    )
}

export const upsertAt = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  return (k: K, v: V) => M.update(flow(upsertAt_(k, v), E.of))
}

export const lookup = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const find = RM.lookup(M.keyEq)

  return (k: K) => pipe(M.get, E.map(find(k)))
}

export const deleteAt = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const del = deleteAt_(M.keyEq)

  return (k: K) => M.update((current) => pipe(current, del(k), E.of))
}

export const elem = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const find = RM.elem(M.valueEq)

  return (v: V) => pipe(M.get, E.map(find(v)))
}

export const filter = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  function filterM<V2 extends V>(r: Refinement<V, V2>): E.Env<E1 & Ref.Refs, Map<K, V>>
  function filterM(r: Predicate<V>): E.Env<E1 & Ref.Refs, Map<K, V>>
  function filterM(r: Predicate<V>): E.Env<E1 & Ref.Refs, Map<K, V>> {
    return pipe(M.get, E.map(filter_(r)))
  }

  return filterM
}

export const insertAt = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const insert = insert_(M.keyEq)

  return (k: K, v: V) =>
    M.update((m) =>
      pipe(
        m,
        insert(k, v),
        O.matchW(() => m, identity),
        E.of,
      ),
    )
}

export const modifyAt = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const modify = modify_(M.keyEq)

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

export const updateAt = <E1, K, V>(M: RefMapM<E1, K, V>) => {
  const f = modifyAt(M)

  return (k: K, v: V) => f(k, () => v)
}

export const keys =
  <K>(O: Ord<K>) =>
  <E, V>(M: RefMapM<E, K, V>) =>
    pipe(M.get, E.map(RM.keys(O)))

export const size = <E, K, V>(M: RefMapM<E, K, V>) => pipe(M.get, E.map(RM.size))

export const toReadonlyArray =
  <K>(O: Ord<K>) =>
  <E, V>(M: RefMapM<E, K, V>) =>
    pipe(M.get, E.map(RM.toReadonlyArray(O)))

export const values =
  <V>(O: Ord<V>) =>
  <E, K>(M: RefMapM<E, K, V>) =>
    pipe(M.get, E.map(RM.values(O)))

export interface Wrapped<E, K, V> extends RefMapM<E, K, V> {
  readonly getOrCreate: <E2>(k: K, orCreate: E.Env<E2, V>) => E.Env<E & E2 & Ref.Refs, V>
  readonly upsertAt: (k: K, v: V) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly lookup: (k: K) => E.Env<E & Ref.Refs, O.Option<V>>
  readonly elem: (v: V) => E.Env<E & Ref.Refs, boolean>
  readonly filter: {
    <V2 extends V>(r: Refinement<V, V2>): E.Env<E & Ref.Refs, Map<K, V>>
    (r: Predicate<V>): E.Env<E & Ref.Refs, Map<K, V>>
  }
  readonly insertAt: (k: K, v: V) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly updateAt: (k: K, v: V) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly modifyAt: (k: K, v: Endomorphism<V>) => E.Env<E & Ref.Refs, Map<K, V>>
  readonly deleteAt: (k: K) => E.Env<E & Ref.Refs, Map<K, V>>
}

export function wrap<E, K, V>(M: RefMapM<E, K, V>): Wrapped<E, K, V> {
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

export const create = flow(make, wrap)

export type KeyValueOptions<K, V> = Omit<RefMapMOptions<K, V>, 'eq'>

export const kv = <K, V>(options: KeyValueOptions<K, V> = {}) =>
  create(
    E.fromIO(() => new Map()),
    options,
  )

export const useSome =
  <E1>(provided: E1) =>
  <E2, K, V>(ref: Wrapped<E1 & E2, K, V>): Wrapped<E2, K, V> => {
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

export const provideSome =
  <E1>(provided: E1) =>
  <E2, K, V>(ref: Wrapped<E1 & E2, K, V>): Wrapped<E2, K, V> => {
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

export const provideAll: <E>(
  provided: E,
) => <K, V>(ref: Wrapped<E, K, V>) => Wrapped<unknown, K, V> = provideSome

export const useAll: <E>(provided: E) => <K, V>(ref: Wrapped<E, K, V>) => Wrapped<unknown, K, V> =
  useSome

export const WrappedURI = '@typed/fp/RefMapM'
export type WrappedURI = typeof WrappedURI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [WrappedURI]: Wrapped<R, E, A>
  }
}

export const UseSome: P.UseSome3<WrappedURI> = {
  useSome,
}

export const UseAll: P.UseAll3<WrappedURI> = {
  useAll,
}

export const ProvideSome: P.ProvideSome3<WrappedURI> = {
  provideSome,
}

export const ProvideAll: P.ProvideAll3<WrappedURI> = {
  provideAll,
}

export const Provide: P.Provide3<WrappedURI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

// Internal helpers

const upsertAt_ =
  <K, V>(k: K, v: V) =>
  (map: Map<K, V>): Map<K, V> => {
    map.set(k, v)

    return map
  }

const deleteAt_ =
  <K>(Eq: Eq<K>) =>
  <V>(k: K) =>
  (map: Map<K, V>): Map<K, V> => {
    for (const key of map.keys()) {
      if (Eq.equals(key)(k)) {
        map.delete(key)
      }
    }

    return map
  }

const filter_ =
  <V>(predicate: Predicate<V>) =>
  <K>(map: Map<K, V>): Map<K, V> => {
    for (const [key, value] of map) {
      if (!predicate(value)) {
        map.delete(key)
      }
    }

    return map
  }

const insert_ = <K>(Eq: Eq<K>) => {
  const find = RM.lookup(Eq)

  return <V>(k: K, v: V) =>
    (map: Map<K, V>): O.Option<Map<K, V>> =>
      pipe(
        map,
        find(k),
        O.map(() => map.set(k, v)),
      )
}

const modify_ = <K>(Eq: Eq<K>) => {
  const find = RM.lookup(Eq)

  return <V>(k: K, f: Endomorphism<V>) =>
    (map: Map<K, V>): O.Option<Map<K, V>> =>
      pipe(
        map,
        find(k),
        O.map((v) => map.set(k, f(v))),
      )
}
