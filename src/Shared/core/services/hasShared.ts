import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { SharedEnv } from '@typed/fp/Shared/core/services/SharedEnv'

import { Shared } from '../model/Shared'
import { getKeyStore } from './getKeyStore'

/**
 * Check to see if the current Namespace has the given Shared value.
 */
export const hasShared = <S extends Shared>(shared: S): Effect<SharedEnv, boolean> => {
  const eff = doEffect(function* () {
    const keyStore = yield* getKeyStore

    return keyStore.has(shared.key)
  })

  return eff
}
