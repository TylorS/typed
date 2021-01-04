import { Pure } from '@fp/Effect/Effect'

import { deleteShared, SharedKey, withShared } from '../core/exports'
import { deleteKey } from './deleteKey'
import { getKey } from './getKey'
import { getKeyOrCreate } from './getKeyOrCreate'
import { hasKey } from './hasKey'
import { setKey } from './setKey'
import { SharedMap } from './SharedMap'
import { withMutations } from './withMutations'

/**
 * Wrap a SharedMap in useful operations.
 */
export const wrapMap = <SK extends SharedKey, K, V>(shared: SharedMap<SK, K, V>) => {
  return {
    ...shared,
    get: getKey(shared),
    getOrCreate: getKeyOrCreate(shared),
    has: hasKey(shared),
    set: setKey(shared),
    delete: deleteKey(shared),
    clear: deleteShared(shared),
    size: withShared(shared, function* (m) {
      return yield* Pure.of(m.size)
    }),
    withMutations: withMutations(shared),
  } as const
}
