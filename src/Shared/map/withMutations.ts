import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { getShared, setShared, SharedEnv, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'

export const withMutations = curry(
  <SK extends SharedKey, K, V>(
    shared: SharedMap<SK, K, V>,
    withMutable: (map: Map<K, V>) => void,
  ): Effect<SharedEnv, ReadonlyMap<K, V>> => {
    const eff = doEffect(function* () {
      const map = yield* getShared(shared)
      const mutable = new Map(map)

      withMutable(mutable)

      return yield* setShared(shared, mutable)
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
