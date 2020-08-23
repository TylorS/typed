import { Effect } from '@typed/fp/Effect'
import { callOp, createOp, Op } from '@typed/fp/Op'

import { HookEnv, HookEnvironment } from './HookEnvironment'

export const RUN_WITH_HOOKS = Symbol('@typed/fp/hooks/RunWithHooks')
export type RUN_WITH_HOOKS = typeof RUN_WITH_HOOKS

export interface RunWithHooksOp
  extends Op<
    RUN_WITH_HOOKS,
    <E, A>(eff: Effect<E & HookEnv, A>, hookEnvironment: HookEnvironment) => Effect<E, A>
  > {}

export const RunWithHooksOp = createOp<RunWithHooksOp>(RUN_WITH_HOOKS)

export const runWithHooks = callOp(RunWithHooksOp)

declare module '@typed/fp/Op' {
  export interface Ops<Env> {
    [RUN_WITH_HOOKS]: <E, A>(
      eff: Effect<E & HookEnv, A>,
      hookEnvironment: HookEnvironment,
    ) => Effect<Env & E, A>
  }
}
