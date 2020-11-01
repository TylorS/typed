import { doEffect } from '@typed/fp/Effect/exports'

import { getSharedEnv, sendSharedEvent } from './SharedEnv'
import { SharedValueUpdated } from './SharedEvent'

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
    const { keyStores, consumers } = yield* getSharedEnv
    const consumersOfKey = consumers.get(namespace)?.get(shared.key)
    const keyStore = keyStores.get(namespace)

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

  return eff
}
