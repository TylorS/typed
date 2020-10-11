import { Effect } from '@typed/fp/Effect/exports'
import { createSharedRef, Ref, SharedRef, wrapSharedMap } from '@typed/fp/SharedRef/exports'

import { HookEnvironmentId } from '../../core/exports'

export const RENDERER_ENVS = '@typed/fp/hooks/RendererEnvs'
export type RENDERER_ENVS = typeof RENDERER_ENVS

export interface RendererEnvs
  extends SharedRef<
    RENDERER_ENVS,
    Map<HookEnvironmentId, readonly [effect: (ref: Ref<any>) => Effect<any, any>, env: any]>
  > {}

export const RendererEnvs = createSharedRef<RendererEnvs>(RENDERER_ENVS)

export const rendererEnvs = wrapSharedMap(RendererEnvs)
