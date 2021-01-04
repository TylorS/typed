import { Pure } from '@fp/Effect/exports'

import { deleteShared, SharedKey, withShared } from '../core/exports'
import { addValue } from './addValue'
import { deleteValue } from './deleteValue'
import { hasValue } from './hasValue'
import { SharedSet } from './SharedSet'
import { withMutations } from './withMutations'

/**
 * Wrap a Shared Set in common operations.
 */
export const wrapSet = <K extends SharedKey, V>(shared: SharedSet<K, V>) => {
  return {
    ...shared,
    add: addValue(shared),
    delete: deleteValue(shared),
    has: hasValue(shared),
    size: withShared(shared, function* (m) {
      return yield* Pure.of(m.size)
    }),
    clear: deleteShared(shared),
    withMutations: withMutations(shared),
  } as const
}
