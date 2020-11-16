import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { none, Option, some } from 'fp-ts/Option'

import { getShared, SharedEnv, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'

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
