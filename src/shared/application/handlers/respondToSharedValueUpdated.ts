import { doEffect } from '@typed/fp/Effect/exports'
import {
  getKeyStore,
  sendSharedEvent,
  SharedValueUpdated,
  usingNamespace,
} from '@typed/fp/Shared/domain/exports'
import { pipe } from 'fp-ts/function'

import { getNamespaceConsumers } from '../context/exports'

/**
 * Traverse the consumer tree to mark other namespaces as updated.
 */
export function respondToSharedValueUpdated({
  namespace,
  shared,
  previousValue,
  value,
}: SharedValueUpdated) {
  const eff = doEffect(function* () {
    const consumers = yield* getNamespaceConsumers
    const consumersOfKey = consumers.get(shared.key)
    const keyStore = yield* getKeyStore

    if (!consumersOfKey || !keyStore) {
      return
    }

    for (const [namespace, consumers] of consumersOfKey) {
      for (const consumer of consumers) {
        if (!consumer.eq.equals(previousValue, value)) {
          yield* sendSharedEvent({ type: 'namespace/updated', namespace })
          break
        }
      }
    }
  })

  return pipe(eff, usingNamespace(namespace))
}
