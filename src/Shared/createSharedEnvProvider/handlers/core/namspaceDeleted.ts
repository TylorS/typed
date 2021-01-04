import { doEffect, Effect, EffectGenerator } from '@fp/Effect/exports'
import {
  disposeNamespace,
  getKeyStores,
  Namespace,
  NamespaceDeleted,
  SharedEnv,
  usingNamespace,
} from '@fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

export function namespaceDeleted(event: NamespaceDeleted): Effect<SharedEnv, void> {
  return pipe(
    doEffect(() => deleteNamespace(event.namespace)),
    usingNamespace(event.namespace),
  )
}

function* deleteNamespace(namespace: Namespace): EffectGenerator<SharedEnv, void> {
  yield* disposeNamespace // Dispose of all Resources associated with Namespace

  // Delete namespace
  const keyStores = yield* getKeyStores
  keyStores.delete(namespace)
}
