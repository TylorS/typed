import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { none, Option, some } from 'fp-ts/Option'

import { SharedEnv, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'
import { withMutations } from './withMutations'

export const deleteKey = curry(
  <SK extends SharedKey, K, V>(
    shared: SharedMap<SK, K, V>,
    key: K,
  ): Effect<SharedEnv, Option<V>> => {
    const eff = doEffect(function* () {
      let value: Option<V> = none

      yield* withMutations(shared, (map) => {
        if (map.has(key)) {
          value = some(map.get(key)!)
        }

        map.delete(key)
      })

      return value
    })

    return eff
  },
) as {
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K): Effect<SharedEnv, Option<V>>
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>): (
    key: K,
  ) => Effect<SharedEnv, Option<V>>
}
