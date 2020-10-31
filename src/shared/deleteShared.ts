import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { Shared } from './Shared'
import { getCurrentNamespace, getNamespacesMap, sendSharedEvent, SharedEnv } from './SharedEnv'

/**
 * Delete a shared value
 */
export const deleteShared = <S extends Shared>(shared: S): Effect<SharedEnv, void> =>
  doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const namespaces = yield* getNamespacesMap
    const map = namespaces.get(namespace)

    if (!map || !map.has(shared.key)) {
      return
    }

    map.delete(shared.key)

    yield* sendSharedEvent({ type: 'sharedValue/deleted', namespace, shared })
  })
