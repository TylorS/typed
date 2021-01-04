import { doEffect, Effect } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'
import { none, Option, some } from 'fp-ts/Option'

import { getShared, SharedEnv, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'

/**
 * Get a value from a specific key of a SharedMap
 */
export const getKey = curry(
  <SK extends SharedKey, K, V>(
    shared: SharedMap<SK, K, V>,
    key: K,
  ): Effect<SharedEnv, Option<V>> => {
    const eff = doEffect(function* () {
      const map = yield* getShared(shared)

      if (map.has(key)) {
        return some(map.get(key)!)
      }

      return none
    })

    return eff
  },
) as {
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K): Effect<SharedEnv, Option<V>>
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>): (
    key: K,
  ) => Effect<SharedEnv, Option<V>>
}
