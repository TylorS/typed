import { doEffect, Effect, Pure } from '@typed/fp/Effect/exports'
import { createShared, getShared, SharedEnv } from '@typed/fp/Shared/core/exports'
import { createRef, Ref } from '@typed/fp/Shared/Ref/exports'

import { addNamespaceRenderer } from './NamespaceRenderers'

export const RenderRef = createShared(
  Symbol('RenderRef'),
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
