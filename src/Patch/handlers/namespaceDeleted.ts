import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { NamespaceDeleted, SharedEnv, usingNamespace } from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

import { getNamespaceRenderers } from '../NamespaceRenderers'

export function namespaceDeleted(event: NamespaceDeleted): Effect<SharedEnv, void> {
  const eff = doEffect(function* () {
    const renderers = yield* getNamespaceRenderers

    // Bail out if Namespace is not a Renderer.
    // Using getRenderRef will do this for you.
    if (!renderers.has(event.namespace)) {
      return
    }

    renderers.delete(event.namespace)
  })

  return pipe(eff, usingNamespace(event.namespace))
}
