import { HookEnvironmentId } from '@typed/fp/hooks/core/exports'
import { createSharedRef, SharedRef, wrapSharedSet } from '@typed/fp/SharedRef/exports'

export const UPDATED_ENVS = '@typed/fp/hooks/UpdatedEnvs'
export type UPDATED_ENVS = typeof UPDATED_ENVS

export interface UpdatedEnvs extends SharedRef<UPDATED_ENVS, Set<HookEnvironmentId>> {}

export const UpdatedEnvs = createSharedRef<UpdatedEnvs>(UPDATED_ENVS)

export const updatedEnvs = wrapSharedSet(UpdatedEnvs)
