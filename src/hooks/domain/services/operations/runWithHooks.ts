import { Effect } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'
import { iso } from 'newtype-ts'

import { HookRequirements } from '../../model'
import { HookOpEnvs } from './HookOps'

export const RUN_WITH_HOOKS = Symbol('@typed/fp/hooks/RunWithHooks')
export type RUN_WITH_HOOKS = typeof RUN_WITH_HOOKS

export const hookRequirementsIso = iso<HookRequirements>()

export interface RunWithHooksOp
  extends Op<RUN_WITH_HOOKS, <E, A>(eff: Effect<E, A>, req: HookRequirements) => Effect<E, A>> {}

export const RunWithHooksOp = createOp<RunWithHooksOp>(RUN_WITH_HOOKS)

export const runWithHooks = callOp(RunWithHooksOp)

declare module '@typed/fp/Op' {
  export interface Ops<Env> {
    [RUN_WITH_HOOKS]: <E, A>(
      eff: Effect<E & HookOpEnvs, A>,
      req: HookRequirements,
    ) => Effect<Env & E, A>
  }
}
