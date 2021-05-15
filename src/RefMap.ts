import { pipe } from '@fp/function'
import { Eq } from 'fp-ts/Eq'
import { constant, identity } from 'fp-ts/function'
import { match, Option } from 'fp-ts/Option'
import * as RM from 'fp-ts/ReadonlyMap'

import * as E from './Env'
import { deepEqualsEq } from './Eq'
import { createRef, getRef, modifyRef_, Ref, Refs } from './Ref'

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

export const fromId =
  <K, V>(k: Eq<K> = deepEqualsEq, v: Eq<V> = deepEqualsEq) =>
  <Id extends PropertyKey>(id: Id) =>
    createRefMap(
      E.asks((e: Readonly<Record<Id, ReadonlyMap<K, V>>>) => e[id]),
      id,
      k,
      v,
    )

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
