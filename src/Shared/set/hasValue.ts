import { Effect } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'

import { SharedEnv, SharedKey, withShared } from '../core/exports'
import { SharedSet } from './SharedSet'

/**
 * Check if a SharedSet has a given values
 */
export const hasValue = curry(
  <K extends SharedKey, V>(shared: SharedSet<K, V>, value: V): Effect<SharedEnv, boolean> =>
    // eslint-disable-next-line require-yield
    withShared(shared, function* (set) {
      return set.has(value)
    }),
) as {
  <K extends SharedKey, V>(shared: SharedSet<K, V>, value: V): Effect<SharedEnv, boolean>
  <K extends SharedKey, V>(shared: SharedSet<K, V>): (value: V) => Effect<SharedEnv, boolean>
}
