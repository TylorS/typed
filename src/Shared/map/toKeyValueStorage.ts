import { ask, doEffect, Effect, Pure, toEnv } from '@typed/fp/Effect/exports'
import { map as mapR, sync } from '@typed/fp/Resume/exports'
import { KeyValueStorage } from '@typed/fp/Storage/exports'
import { right } from 'fp-ts/Either'
import { pipe } from 'fp-ts/function'
import { none, some } from 'fp-ts/Option'

import { createShared, deleteShared, getShared, SharedEnv, SharedKey } from '../core/exports'
import { deleteKey } from './deleteKey'
import { setKey } from './setKey'
import { SharedMap } from './SharedMap'

export const KeyValueStorages = createShared(
  Symbol.for('KeyValueStorages'),
  Pure.fromIO(() => new Map<SharedKey, KeyValueStorage<any, any>>()),
)

/**
 * Converts a SharedMap into KeyValueStorage
 */
export function toKeyValueStorage<SK extends SharedKey, K, V>(
  sm: SharedMap<SK, K, V>,
): Effect<SharedEnv, KeyValueStorage<K, V>> {
  const eff = doEffect(function* () {
    const map = yield* getShared(sm)
    const storages = yield* getShared(KeyValueStorages)

    if (storages.has(sm.key)) {
      return storages.get(sm.key)! as KeyValueStorage<K, V>
    }

    const env = yield* ask<SharedEnv>()

    const kv: KeyValueStorage<K, V> = {
      getKeys: () => sync(right<Error, readonly K[]>(Array.from(map.keys()))),
      getItems: () => sync(right<Error, readonly V[]>(Array.from(map.values()))),
      getItem: (key: K) => sync(right(map.has(key) ? some(map.get(key)!) : none)),
      setItem: (key: K, value: V) => mapR(right, pipe(setKey(sm, key, value), toEnv)(env)),
      removeItem: (key: K) => mapR(right, pipe(deleteKey(sm, key), toEnv)(env)),
      clearItems: () => mapR(() => right(true), pipe(deleteShared(sm), toEnv)(env)),
    }

    storages.set(sm.key, kv)

    return kv
  })

  return eff
}
