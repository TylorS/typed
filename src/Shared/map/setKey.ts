import { doEffect, Effect } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'

import { SharedEnv } from '../core/exports'
import { SharedKey } from '../core/model/exports'
import { SharedMap } from './SharedMap'
import { withMutations } from './withMutations'

/**
 * Set the value of a key in a SharedMap
 */
export const setKey = curry(
  <SK extends SharedKey, K, V>(
    shared: SharedMap<SK, K, V>,
    key: K,
    value: V,
  ): Effect<SharedEnv, V> =>
    doEffect(function* () {
      yield* withMutations(shared, (map) => map.set(key, value))

      return value
    }),
) as {
  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K, value: V): Effect<SharedEnv, V>

  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>, key: K): (
    value: V,
  ) => Effect<SharedEnv, V>

  <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>): {
    (key: K, value: V): Effect<SharedEnv, V>
    (key: K): (value: V) => Effect<SharedEnv, V>
  }
}
