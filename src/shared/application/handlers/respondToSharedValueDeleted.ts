import { doEffect } from '@typed/fp/Effect/exports'
import { SharedValueDeleted, usingNamespace } from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'

import { getNamespaceConsumers, getNamspaceProviders } from '../context/exports'

/**
 * Remove shared value references from consumer tree.
 */
export function respondToSharedValueDeleted({ namespace, shared }: SharedValueDeleted) {
  const eff = doEffect(function* () {
    const consumers = yield* getNamespaceConsumers
    const consumersOf = consumers.get(shared.key)

    consumers.delete(shared.key)

    if (consumersOf) {
      for (const consumer of consumersOf.keys()) {
        const providers = yield* pipe(getNamspaceProviders, usingNamespace(consumer))

        providers.delete(namespace)
      }
    }
  })

  return pipe(eff, usingNamespace(namespace))
}
