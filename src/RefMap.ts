import { pipe } from '@fp/function'
import { Eq } from 'fp-ts/Eq'
import { constant, identity } from 'fp-ts/function'
import { match, Option } from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

import * as E from './Env'
import { deepEqualsEq } from './Eq'
import { createRef, getRef, modifyRef, Ref, Refs } from './Ref'

export interface RefMap<E, K, V> extends Ref<E, ReadonlyMap<K, V>> {
  readonly key: Eq<K>
  readonly value: Eq<V>
}

export const createRefMap = <E, K, V>(
  initial: E.Env<E, ReadonlyMap<K, V>>,
  id: PropertyKey = Symbol(`RefMap`),
  key: Eq<K> = deepEqualsEq,
  value: Eq<V> = deepEqualsEq,
): RefMap<E, K, V> => ({ ...createRef(initial, id, RM.getEq(key, value)), key, value })

export const kv = <K, V>(k: Eq<K> = deepEqualsEq, v: Eq<V> = deepEqualsEq) =>
  createRefMap(
    E.fromIO(() => new Map()),
    Symbol(`kv:RefMap`),
    k,
    v,
  )

export const fromId = <K, V>(k: Eq<K> = deepEqualsEq, v: Eq<V> = deepEqualsEq) => <
  Id extends PropertyKey
>(
  id: Id,
) =>
  createRefMap(
    E.asks((e: Readonly<Record<Id, ReadonlyMap<K, V>>>) => e[id]),
    id,
    k,
    v,
  )

export const getKv = <K>(key: K) => <E, V>(refMap: RefMap<E, K, V>): E.Env<E & Refs, Option<V>> =>
  pipe(refMap, getRef, E.map(RM.lookup(refMap.key)(key)))

export const setKv = <K, V>(key: K, value: V) => <E>(refMap: RefMap<E, K, V>) =>
  pipe(
    refMap,
    modifyRef(RM.upsertAt(refMap.key)(key, value)),
    E.map(() => value),
  )

export const deleteKv = <K>(key: K) => <E, V>(refMap: RefMap<E, K, V>) =>
  pipe(
    pipe(refMap, getKv(key)),
    E.chainFirst(() =>
      pipe(
        refMap,
        modifyRef((map) => pipe(map, RM.deleteAt(refMap.key)(key), match(constant(map), identity))),
      ),
    ),
  )
