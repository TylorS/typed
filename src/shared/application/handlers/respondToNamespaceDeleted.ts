import { doEffect, Effect } from '@typed/fp/Effect/exports'
import {
  deleteKeyStore,
  NamespaceDeleted,
  SharedEnv,
  usingNamespace,
} from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'

import { getNamespaceConsumers, getNamspaceProviders } from '../context/exports'
import { getNamespaceDisposable } from '../model/exports'

/**
 * Cleanup all resources related to a given namespace
 */
export function respondToNamespaceDeleted({
  namespace,
}: NamespaceDeleted): Effect<SharedEnv, void> {
  const eff = doEffect(function* () {
    const providers = yield* getNamspaceProviders

    for (const provider of providers) {
      const consumers = yield* pipe(getNamespaceConsumers, usingNamespace(provider))

      consumers.forEach((m) => m.delete(namespace))
    }

    const disposable = yield* getNamespaceDisposable
    disposable.dispose()

    yield* deleteKeyStore(namespace)
  })

  return pipe(eff, usingNamespace(namespace))
}
