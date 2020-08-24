import { doEffect, Effect } from '@typed/fp/Effect'
import { OpEnv } from '@typed/fp/Op'
import { createUuid, UuidEnv } from '@typed/fp/Uuid'

import { GetKeyedReqirementsOp, getKeyedRequirements } from './getKeyedRequirements'
import { HookRequirements } from './runWithHooks'
import { useRef, UseRefOp } from './useRef'

export const useHookRequirementsRef: Effect<
  OpEnv<UseRefOp> & OpEnv<GetKeyedReqirementsOp> & UuidEnv,
  HookRequirements
> = doEffect(function* () {
  const idRef = yield* useRef(createUuid)
  const requirements = yield* getKeyedRequirements(idRef.current)

  return requirements
})
