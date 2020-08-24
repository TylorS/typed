import { callOp, createOp, Op } from '@typed/fp/Op'

import { Pure } from '../Effect'
import { HookRequirements } from './runWithHooks'

export const CREATE_HOOK_REQUIREMENTS = Symbol('@typed/fp/hooks/CreateHookRequirements')
export type CREATE_HOOK_REQUIREMENTS = typeof CREATE_HOOK_REQUIREMENTS

export interface CreateHookRequirementsOp
  extends Op<CREATE_HOOK_REQUIREMENTS, () => Pure<HookRequirements>> {}
export const CreateHookRequirementsOp = createOp<CreateHookRequirementsOp>(CREATE_HOOK_REQUIREMENTS)

export const createHookRequirements = callOp(CreateHookRequirementsOp)()
