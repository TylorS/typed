import { Effect } from '@fp/Effect/Effect'
import { doEffect } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'

import { getShared, SharedEnv, SharedKey } from '../core/exports'
import { setKey } from './setKey'
import { SharedMap } from './SharedMap'

/**
 * Get the value at a specific key or create it.
 */
export const getKeyOrCreate = curry(
  <SK extends SharedKey, K, V, E>(
    shared: SharedMap<SK, K, V>,
    key: K,
    or: Effect<E, V>,
  ): Effect<SharedEnv & E, V> => {
    const eff = doEffect(function* () {
      const map = yield* getShared(shared)

      if (map.has(key)) {
        return map.get(key)!
      }

      return yield* setKey(shared, key, yield* or)
    })

    return eff
  },
) as {
  <SK extends SharedKey, K, V, E>(shared: SharedMap<SK, K, V>, key: K, or: Effect<E, V>): Effect<
    SharedEnv & E,
    V
  >

  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K): <E>(
    or: Effect<E, V>,
  ) => Effect<SharedEnv & E, V>

  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>): {
    <E>(key: K, or: Effect<E, V>): Effect<SharedEnv & E, V>
    (key: K): <E>(or: Effect<E, V>) => Effect<SharedEnv & E, V>
  }
}
