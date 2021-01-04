import { Effect } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'

import { SharedEnv, SharedKey } from '../core/exports'
import { SharedSet } from './SharedSet'
import { withMutations } from './withMutations'

/**
 * Add a value to a SharedSet
 */
export const addValue = curry(
  <K extends SharedKey, V>(shared: SharedSet<K, V>, value: V): Effect<SharedEnv, ReadonlySet<V>> =>
    withMutations(shared, (set) => set.add(value)),
) as {
  <K extends SharedKey, V>(shared: SharedSet<K, V>, value: V): Effect<SharedEnv, ReadonlySet<V>>
  <K extends SharedKey, V>(shared: SharedSet<K, V>): (value: V) => Effect<SharedEnv, ReadonlySet<V>>
}
