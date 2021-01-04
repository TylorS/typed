import { doEffect, Effect } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'

import { getShared, setShared, SharedEnv, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'

/**
 * Provide a mutable interface to a SharedMap
 */
export const withMutations = curry(
  <SK extends SharedKey, K, V>(
    shared: SharedMap<SK, K, V>,
    withMutable: (map: Map<K, V>) => void,
  ): Effect<SharedEnv, ReadonlyMap<K, V>> => {
    const eff = doEffect(function* () {
      const map = yield* getShared(shared)
      const mutable = new Map(map)

      withMutable(mutable)

      if (!shared.eq.equals(map, mutable)) {
        return yield* setShared(shared, mutable)
      }

      return map
    })

    return eff
  },
) as {
  <SK extends SharedKey, K, V>(
    shared: SharedMap<SK, K, V>,
    withMutable: (map: Map<K, V>) => void,
  ): Effect<SharedEnv, ReadonlyMap<K, V>>

  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>): (
    withMutable: (map: Map<K, V>) => void,
  ) => Effect<SharedEnv, ReadonlyMap<K, V>>
}
