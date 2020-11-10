import { doEffect } from '@typed/fp/Effect/exports'
import { getNamespaceConsumers } from '@typed/fp/Shared/context/exports'
import {
  getKeyStore,
  sendSharedEvent,
  Shared,
  SharedValueUpdated,
  usingNamespace,
} from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function sharedValueUpdated({
  namespace,
  shared,
  previousValue,
  value,
}: SharedValueUpdated) {
  return pipe(
    doEffect(() => updateSharedValue(shared, previousValue, value)),
    usingNamespace(namespace),
  )
}

function* updateSharedValue(shared: Shared, previousValue: unknown, value: unknown) {
  const consumers = yield* getNamespaceConsumers
  const consumersOfKey = consumers.get(shared.key)
  const keyStore = yield* getKeyStore

  if (!consumersOfKey || !keyStore) {
    return
  }

  for (const [namespace, consumers] of consumersOfKey) {
    for (const consumer of consumers) {
      if (!consumer.equals(previousValue, value)) {
        yield* sendSharedEvent({ type: 'namespace/updated', namespace })

        // Only need one consumer to be mark namespace updated
        break
      }
    }
  }
}
