import { Effect } from '@typed/fp/Effect/exports'
import { none, Option, some } from 'fp-ts/Option'

import { sendSharedEvent } from '../events/exports'
import { Shared, ValueOf } from '../model/exports'
import { SharedEnv } from '../SharedEnv'
import { getCurrentNamespace } from './getCurrentNamespace'
import { withKeyStore } from './withKeyStore'

/**
 * Delete the current Shared value. This will allow the next getShared to reset the value.
 */
export const deleteShared = <S extends Shared>(shared: S): Effect<SharedEnv, Option<ValueOf<S>>> =>
  withKeyStore(function* (keyStore) {
    if (keyStore.has(shared.key)) {
      const value = keyStore.get(shared.key)!

      keyStore.delete(shared.key)

      yield* sendSharedEvent({
        type: 'sharedValue/deleted',
        namespace: yield* getCurrentNamespace,
        shared,
      })

      return some(value)
    }

    return none
  })
