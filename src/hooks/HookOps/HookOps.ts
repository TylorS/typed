import { OpEnvs } from '@typed/fp/Op/provideOpGroup'

import { GetKeyedEnvOp } from '../getKeyedEnv'
import { ProvideChannelOp } from '../provideChannel'
import { RemoveKeyedEnvOp } from '../removeKeyedEnv'
import { RunWithHooksOp } from '../runWithHooks'
import { UseChannelOp } from '../useChannel'
import { UseRefOp } from '../useRef'
import { UseStateOp } from '../useState'

export const HookOps = [
  UseRefOp,
  UseStateOp,
  UseChannelOp,
  ProvideChannelOp,
  RunWithHooksOp,
  GetKeyedEnvOp,
  RemoveKeyedEnvOp,
] as const
export type HookOps = typeof HookOps

export type HookOpEnvs = OpEnvs<HookOps>
