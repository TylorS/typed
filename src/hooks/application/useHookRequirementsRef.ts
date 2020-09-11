import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { OpEnv } from '@typed/fp/Op/exports'
import { createUuid, UuidEnv } from '@typed/fp/Uuid/exports'

import {
  GetKeyedReqirementsOp,
  getKeyedRequirements,
  HookRequirements,
  useRef,
  UseRefOp,
} from '../domain/exports'

export const useHookRequirementsRef: Effect<
  OpEnv<UseRefOp> & OpEnv<GetKeyedReqirementsOp> & UuidEnv,
  HookRequirements
> = doEffect(function* () {
  const idRef = yield* useRef(createUuid)
  const requirements = yield* getKeyedRequirements(idRef.current)

  return requirements
})
