import { Pure } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

import { HookRequirements } from './runWithHooks'

export const GET_KEYED_REQUREMENTS = Symbol('@typed/fp/hooks/GetKeyedEnv')
export type GET_KEYED_REQUIREMENTS = typeof GET_KEYED_REQUREMENTS

export interface GetKeyedReqirementsOp
  extends Op<GET_KEYED_REQUIREMENTS, (key: any) => Pure<HookRequirements>> {}
export const GetKeyedReqirementsOp = createOp<GetKeyedReqirementsOp>(GET_KEYED_REQUREMENTS)

export const getKeyedRequirements = callOp(GetKeyedReqirementsOp)
