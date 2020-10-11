import { createSharedRef, SharedRef, wrapSharedSet } from '@typed/fp/SharedRef/exports'

import { HookEnvironmentId } from '../../core/exports'

export const UPDATING_ENVS = '@typed/fp/hooks/UpdatingEnvs'
export type UPDATING_ENVS = typeof UPDATING_ENVS

export interface UpdatingEnvs extends SharedRef<UPDATING_ENVS, Set<HookEnvironmentId>> {}

export const UpdatingEnvs = createSharedRef<UpdatingEnvs>(UPDATING_ENVS)

export const updatingEnvs = wrapSharedSet(UpdatingEnvs)
