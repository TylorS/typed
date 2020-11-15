import { ask, doEffect, Effect } from '@typed/fp/Effect/exports'
import { NamespaceCompleted, SharedEnv, usingNamespace } from '@typed/fp/Shared/core/exports'
import { pipe } from 'fp-ts/function'

import { getNamespaceRenderers } from '../NamespaceRenderers'
import { setRenderer } from '../Renderer'

export function namespaceCompleted(event: NamespaceCompleted): Effect<SharedEnv, void> {
  const eff = doEffect(function* () {
    const renderers = yield* getNamespaceRenderers

    // Bail out if Namespace is not a Renderer.
    // Using getRenderRef will do this for you.
    if (!renderers.has(event.namespace)) {
      return
    }

    // Set the current Renderer
    yield* setRenderer(event.effect, yield* ask())
  })

  return pipe(eff, usingNamespace(event.namespace))
}
