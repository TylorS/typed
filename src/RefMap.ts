import * as E from '@fp/Env'
import { deepEqualsEq } from '@fp/Eq'
import { pipe } from '@fp/function'
import { createRef, getRef, modifyRef_, Refs, WrappedRef } from '@fp/Ref'
import { Eq } from 'fp-ts/Eq'
import { constant, flow, identity } from 'fp-ts/function'
import { match, Option } from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

export interface RefMap<E, K, V> extends WrappedRef<Refs, E, ReadonlyMap<K, V>> {
  readonly key: Eq<K>
  readonly value: Eq<V>
}

export const makeRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  id: PropertyKey = Symbol(`RefMap`),
  key: Eq<K> = deepEqualsEq,
  value: Eq<V> = deepEqualsEq,
): RefMap<E, K, V> => ({ ...createRef(initial, id, RM.getEq(key, value)), key, value })

export const lookup =
  <E, K, V>(refMap: RefMap<E, K, V>) =>
  (key: K): E.Env<E & Refs, Option<V>> =>
    pipe(refMap, getRef, E.map(RM.lookup(refMap.key)(key)))

export const upsertAt =
  <E, K, V>(refMap: RefMap<E, K, V>) =>
  (key: K, value: V) =>
    pipe(
      refMap,
      modifyRef_(RM.upsertAt(refMap.key)(key, value)),
      E.map(() => value),
    )

export const deleteAt =
  <E, K, V>(refMap: RefMap<E, K, V>) =>
  (key: K) =>
    pipe(
      key,
      lookup(refMap),
      E.chainFirst(() =>
        pipe(
          refMap,
          modifyRef_((map) =>
            pipe(map, RM.deleteAt(refMap.key)(key), match(constant(map), identity)),
          ),
        ),
      ),
    )

export interface WrappedRefMap<R, E, K, V> extends RefMap<E, K, V> {
  readonly lookup: (key: K) => E.Env<R & E, Option<V>>
  readonly upsertAt: (key: K, value: V) => E.Env<R & E, V>
  readonly deleteAt: (key: K) => E.Env<R & E, Option<V>>
}

export const wrapRefMap = <E, K, V>(refMap: RefMap<E, K, V>): WrappedRefMap<Refs, E, K, V> => ({
  ...refMap,
  lookup: lookup(refMap),
  upsertAt: upsertAt(refMap),
  deleteAt: deleteAt(refMap),
})

export const createRefMap = flow(makeRefMap, wrapRefMap)

export const kv = <K, V>(k: Eq<K> = deepEqualsEq, v: Eq<V> = deepEqualsEq) =>
  createRefMap(
    E.fromIO(() => new Map()),
    Symbol(`kv:RefMap`),
    k,
    v,
  )

export const fromId =
  <K, V>(k: Eq<K> = deepEqualsEq, v: Eq<V> = deepEqualsEq) =>
  <Id extends PropertyKey>(id: Id) =>
    createRefMap(
      E.asks((e: Readonly<Record<Id, ReadonlyMap<K, V>>>) => e[id]),
      id,
      k,
      v,
    )
