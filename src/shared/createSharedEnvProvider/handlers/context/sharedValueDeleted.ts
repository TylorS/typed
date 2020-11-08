import { doEffect } from '@typed/fp/Effect/exports'
import { getNamespaceConsumers, getNamspaceProviders } from '@typed/fp/shared/context/exports'
import { SharedValueDeleted } from '@typed/fp/shared/core/events/exports'
import { Namespace, Shared, usingNamespace } from '@typed/fp/shared/core/exports'
import { pipe } from 'fp-ts/function'

export function sharedValueDeleted({ namespace, shared }: SharedValueDeleted) {
  return pipe(
    doEffect(() => deleteSharedValues(namespace, shared)),
    usingNamespace(namespace),
  )
}

function* deleteSharedValues(namespace: Namespace, shared: Shared) {
  const consumers = yield* getNamespaceConsumers
  const consumersOf = consumers.get(shared.key)

  consumers.delete(shared.key)

  if (consumersOf) {
    for (const consumer of consumersOf.keys()) {
      const providers = yield* pipe(getNamspaceProviders, usingNamespace(consumer))

      providers.delete(namespace)
    }
  }
}
