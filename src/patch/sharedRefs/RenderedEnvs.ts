import { HookEnvironmentId } from '@typed/fp/hooks/core/exports'
import { createSharedRef, Ref, SharedRef, wrapSharedMap } from '@typed/fp/SharedRef/exports'

export const RENDERED_ENVS = '@typed/fp/hooks/RenderableEnvs'
export type RENDERED_ENVS = typeof RENDERED_ENVS

export interface RenderedEnvs
  extends SharedRef<RENDERED_ENVS, Map<HookEnvironmentId, Ref<unknown | undefined>>> {}

export const RenderedEnvs = createSharedRef<RenderedEnvs>(RENDERED_ENVS)

export const renderedEnvs = wrapSharedMap(RenderedEnvs)
