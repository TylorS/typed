import { Pure } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

import { HookRequirements } from './runWithHooks'

export const GET_KEYED_ENV = Symbol('@typed/fp/hooks/GetKeyedEnv')
export type GET_KEYED_ENV = typeof GET_KEYED_ENV

export interface GetKeyedEnvOp extends Op<GET_KEYED_ENV, (key: any) => Pure<HookRequirements>> {}
export const GetKeyedEnvOp = createOp<GetKeyedEnvOp>(GET_KEYED_ENV)

export const getKeyedEnv = callOp(GetKeyedEnvOp)
