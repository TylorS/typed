import { doEffect, Effect } from '@fp/Effect/exports'
import { none, Option, some } from 'fp-ts/Option'

import { sendSharedEvent } from '../events/exports'
import { GetSharedEnv, GetSharedValue, Shared } from '../model/exports'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getKeyStore } from './getKeyStore'
import { SharedEnv } from './SharedEnv'

/**
 * Delete the current Shared value. This will allow the next getShared to reset the value.
 */
export const deleteShared = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & GetSharedEnv<S>, Option<GetSharedValue<S>>> =>
  doEffect(function* () {
    const keyStore = yield* getKeyStore

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
