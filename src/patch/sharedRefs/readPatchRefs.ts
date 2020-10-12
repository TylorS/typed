import { doEffect } from '@typed/fp/Effect/exports'
import { readSharedRef } from '@typed/fp/SharedRef/exports'

import { RenderablesEnvs } from './RenderableEnvs'
import { RenderedEnvs } from './RenderedEnvs'
import { RendererEnvs } from './RendererEnvs'
import { UpdatedEnvs } from './UpdatedEnvs'
import { UpdatingEnvs } from './UpdatingEnvs'

export const readPatchRefs = doEffect(function* () {
  const renderables = yield* readSharedRef(RenderablesEnvs)
  const renderers = yield* readSharedRef(RendererEnvs)
  const rendered = yield* readSharedRef(RenderedEnvs)
  const updated = yield* readSharedRef(UpdatedEnvs)
  const updating = yield* readSharedRef(UpdatingEnvs)

  return {
    renderables,
    renderers,
    rendered,
    updated,
    updating,
  } as const
})
