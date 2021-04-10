import { Env, useSome } from '@fp/Env'
import { SchedulerEnv } from '@fp/Scheduler'
import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'

import { CurrentFiber, ForkOptions } from '../Fiber'
import { createFiber } from './createFiber'
import { createRuntime } from './createRuntime'

/**
 * Intended to be used to create the root of your application. If you are creating additional
 * fibers and they should have an associated parent Fiber, please use fork() instead.
 */
export function runAsFiber(scheduler: Scheduler, options: ForkOptions = {}) {
  const runtime = createRuntime(scheduler)

  return <A>(
    env:
      | Env<typeof runtime, A>
      | Env<typeof runtime & CurrentFiber, A>
      | Env<typeof runtime & SchedulerEnv, A>
      | Env<typeof runtime & CurrentFiber & SchedulerEnv, A>,
  ) => createFiber(pipe(env, useSome(runtime)), { scheduler, ...options })
}
