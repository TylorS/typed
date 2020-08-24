import { doEffect, Effect } from '@typed/fp/Effect'
import { OpEnv } from '@typed/fp/Op'
import { createUuid, UuidEnv } from '@typed/fp/Uuid'

import { getKeyedEnv, GetKeyedEnvOp, HookEnvironment, useRef, UseRefOp } from '../domain'

export const useHookEnvRef: Effect<
  OpEnv<UseRefOp> & UuidEnv & OpEnv<GetKeyedEnvOp>,
  HookEnvironment
> = doEffect(function* () {
  const idRef = yield* useRef(createUuid)
  const hookEnvironment = yield* getKeyedEnv(idRef.value)

  return hookEnvironment
})
