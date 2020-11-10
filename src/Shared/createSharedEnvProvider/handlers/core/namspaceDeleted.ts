import { doEffect } from '@typed/fp/Effect/exports'
import {
  disposeNamespace,
  getKeyStores,
  Namespace,
  NamespaceDeleted,
  usingNamespace,
} from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceDeleted(event: NamespaceDeleted) {
  return pipe(
    doEffect(() => deleteNamespace(event.namespace)),
    usingNamespace(event.namespace),
  )
}

function* deleteNamespace(namespace: Namespace) {
  yield* disposeNamespace // Dispose of all Resources associated with Namespace

  // Delete namespace
  const keyStores = yield* getKeyStores
  keyStores.delete(namespace)
}
