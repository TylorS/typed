import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { Shared } from './Shared'
import { getCurrentNamespace, getSharedEnv, sendSharedEvent, SharedEnv } from './SharedEnv'

/**
 * Delete a shared value. Will allow re-initializing a default value the next time you
 * ask for it.
 */
export const deleteShared = <S extends Shared>(shared: S): Effect<SharedEnv, void> =>
  doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const { keyStores } = yield* getSharedEnv
    const map = keyStores.get(namespace)

    if (!map || !map.has(shared.key)) {
      return
    }

    map.delete(shared.key)

    yield* sendSharedEvent({ type: 'sharedValue/deleted', namespace, shared })
  })
