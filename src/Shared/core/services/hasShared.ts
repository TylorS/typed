import { doEffect } from '@typed/fp/Effect/exports'

import { Shared } from '../model/Shared'
import { getKeyStore } from './getKeyStore'

export const hasShared = <S extends Shared>(shared: S) => {
  const eff = doEffect(function* () {
    const keyStore = yield* getKeyStore

    return keyStore.has(shared.key)
  })

  return eff
}
