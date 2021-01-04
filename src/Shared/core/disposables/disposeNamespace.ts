import { doEffect } from '@fp/Effect/exports'

import { getKeyStore } from '../services/exports'
import { NamespaceDisposable } from './NamespaceDisposable'

/**
 * Release all resources related to the current namespace
 */
export const disposeNamespace = doEffect(function* () {
  const keyStore = yield* getKeyStore
  const disposable = keyStore.get(NamespaceDisposable.key)

  disposable?.dispose()
})
