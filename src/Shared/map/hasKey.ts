import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { getShared, SharedEnv, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'

export const hasKey = curry(
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K): Effect<SharedEnv, boolean> => {
    const eff = doEffect(function* () {
      const map = yield* getShared(shared)

      return map.has(key)
    })

    return eff
  },
) as {
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K): Effect<SharedEnv, boolean>
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>): (key: K) => Effect<SharedEnv, boolean>
}
