import { doEffect } from '@fp/Effect/exports'
import { getNamespaceConsumers, getNamspaceProviders } from '@fp/Shared/context/exports'
import { Namespace, NamespaceDeleted, usingNamespace } from '@fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceDeleted(event: NamespaceDeleted) {
  return pipe(
    doEffect(() => deleteConsumers(event.namespace)),
    usingNamespace(event.namespace),
  )
}

function* deleteConsumers(namespace: Namespace) {
  const providers = yield* getNamspaceProviders

  for (const provider of providers) {
    const consumers = yield* pipe(getNamespaceConsumers, usingNamespace(provider))

    consumers.forEach((m) => m.delete(namespace))
  }
}
