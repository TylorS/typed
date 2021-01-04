import { doEffect, Effect, Pure } from '@fp/Effect/exports'
import { createShared, getShared, SharedEnv } from '@fp/Shared/core/exports'
import { createRef, Ref } from '@fp/Shared/Ref/exports'

import { addNamespaceRenderer } from './NamespaceRenderers'

/**
 * A Ref to the previously rendered value for a given Namespace.
 */
export const RenderRef = createShared(
  Symbol.for('RenderRef'),
  Pure.fromIO(() => createRef<any>()),
)

/**
 * Get a Ref that can be used to track the most-up-to-date Rendered value for a Namespace
 */
export const getRenderRef = <A>(): Effect<SharedEnv, Ref<A | null | undefined>> => {
  const eff = doEffect(function* () {
    // Registers current Namespace as a Renderer
    yield* addNamespaceRenderer

    return yield* getShared(RenderRef)
  })

  return eff
}
