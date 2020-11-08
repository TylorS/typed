import { doEffect } from '@typed/fp/Effect/exports'
import {
  deleteKeyStore,
  disposeNamespace,
  Namespace,
  NamespaceDeleted,
  usingNamespace,
} from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/lib/function'

export function namespaceDeleted(event: NamespaceDeleted) {
  return pipe(
    doEffect(() => deleteNamespace(event.namespace)),
    usingNamespace(event.namespace),
  )
}

function* deleteNamespace(namespace: Namespace) {
  yield* disposeNamespace // Dispose of all Resources associated with Namespace
  yield* deleteKeyStore(namespace) // Delete Namespace from KeyStores
}
