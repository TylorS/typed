import { Pure } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

export const REMOVE_KEYED_ENV = Symbol('@typed/fp/hooks/RemovedKeyedEnv')
export type REMOVE_KEYED_ENV = typeof REMOVE_KEYED_ENV

export interface RemovKeyedEnvOp extends Op<REMOVE_KEYED_ENV, (key: any) => Pure<void>> {}
export const RemoveKeyedEnvOp = createOp<RemovKeyedEnvOp>(REMOVE_KEYED_ENV)

export const removeKeyedEnv = callOp(RemoveKeyedEnvOp)
