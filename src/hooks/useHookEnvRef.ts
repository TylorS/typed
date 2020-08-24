import { doEffect, Effect } from '@typed/fp/Effect'
import { OpEnv } from '@typed/fp/Op'
import { createUuid, UuidEnv } from '@typed/fp/Uuid'

import { getKeyedEnv, GetKeyedEnvOp } from './getKeyedEnv'
import { HookRequirements } from './runWithHooks'
import { useRef, UseRefOp } from './useRef'

export const useHookRequirementsRef: Effect<
  OpEnv<UseRefOp> & UuidEnv & OpEnv<GetKeyedEnvOp>,
  HookRequirements
> = doEffect(function* () {
  const idRef = yield* useRef(createUuid)
  const hookEnvironment = yield* getKeyedEnv(idRef.value)

  return hookEnvironment
})
