import { OpEnvs } from '@typed/fp/Op/provideOpGroup'

import { AddDisposableOp } from './addDisposable'
import { CreateHookRequirementsOp } from './createHookRequirements'
import { GetKeyedReqirementsOp } from './getKeyedRequirements'
import { ProvideChannelOp } from './provideChannel'
import { RemoveKeyedRequirementsOp } from './removeKeyedRequirements'
import { RunWithHooksOp } from './runWithHooks'
import { UseChannelOp } from './useChannel'
import { UseRefOp } from './useRef'
import { UseStateOp } from './useState'

export const HookOps = [
  UseRefOp,
  UseStateOp,
  UseChannelOp,
  ProvideChannelOp,
  RunWithHooksOp,
  GetKeyedReqirementsOp,
  RemoveKeyedRequirementsOp,
  CreateHookRequirementsOp,
  AddDisposableOp,
] as const

export type HookOps = typeof HookOps

export type HookOpEnvs = OpEnvs<HookOps>
