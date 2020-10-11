import { createSharedRef, Ref, SharedRef, wrapSharedMap } from '@typed/fp/SharedRef/exports'

import { HookEnvironmentId } from '../../core/exports'

export const RENDERABLE_ENVS = '@typed/fp/hooks/RenderableEnvs'
export type RENDERABLE_ENVS = typeof RENDERABLE_ENVS

export interface RenderablesEnvs
  extends SharedRef<RENDERABLE_ENVS, Map<HookEnvironmentId, Ref<unknown | undefined>>> {}

export const RenderablesEnvs = createSharedRef<RenderablesEnvs>(RENDERABLE_ENVS)

export const renderableEnvs = wrapSharedMap(RenderablesEnvs)
