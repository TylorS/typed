import { Pure } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

export const REMOVE_KEYED_REQUIREMENTS = Symbol('@typed/fp/hooks/RemovedKeyedEnv')
export type REMOVE_KEYED_REQUIREMENTS = typeof REMOVE_KEYED_REQUIREMENTS

export interface RemovKeyedRequirementsOp
  extends Op<REMOVE_KEYED_REQUIREMENTS, (key: unknown) => Pure<void>> {}

export const RemoveKeyedRequirementsOp = createOp<RemovKeyedRequirementsOp>(
  REMOVE_KEYED_REQUIREMENTS,
)

export const removeKeyedRequirements = callOp(RemoveKeyedRequirementsOp)
