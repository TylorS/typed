import { doEffect, Effect } from '@typed/fp/Effect'
import { OpEnv } from '@typed/fp/Op'
import { createUuid, UuidEnv } from '@typed/fp/Uuid'

import {
  GetKeyedReqirementsOp,
  getKeyedRequirements,
  HookRequirements,
  useRef,
  UseRefOp,
} from '../domain'

export const useHookRequirementsRef: Effect<
  OpEnv<UseRefOp> & OpEnv<GetKeyedReqirementsOp> & UuidEnv,
  HookRequirements
> = doEffect(function* () {
  const idRef = yield* useRef(createUuid)
  const requirements = yield* getKeyedRequirements(idRef.current)

  return requirements
})
