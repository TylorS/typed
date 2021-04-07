import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'
import { none } from 'fp-ts/Option'

import { Env, provideSome } from '../../Env'
import { SchedulerEnv } from '../../Scheduler'
import { CurrentFiber } from '../Fiber'
import { createFiber } from './createFiber'
import { createRuntime } from './createRuntime'

export function runAsFiber(scheduler: Scheduler) {
  const runtime = createRuntime(scheduler)

  return <A>(
    env:
      | Env<typeof runtime, A>
      | Env<typeof runtime & CurrentFiber, A>
      | Env<typeof runtime & SchedulerEnv, A>
      | Env<typeof runtime & CurrentFiber & SchedulerEnv, A>,
  ) => createFiber(pipe(env, provideSome(runtime)), none, scheduler)
}
