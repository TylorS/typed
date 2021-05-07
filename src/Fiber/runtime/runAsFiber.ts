import { Env, useSome } from '@fp/Env'
import { SchedulerEnv } from '@fp/Scheduler'
import { Scheduler } from '@most/types'
import { pipe } from 'fp-ts/function'

import { CurrentFiber, Fork, ForkOptions, Join, Kill } from '../Fiber'
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
      | Env<Fork, A>
      | Env<Fork & SchedulerEnv, A>
      | Env<Fork & CurrentFiber, A>
      | Env<Fork & CurrentFiber & SchedulerEnv, A>
      | Env<Join, A>
      | Env<Join & SchedulerEnv, A>
      | Env<Join & CurrentFiber, A>
      | Env<Join & CurrentFiber & SchedulerEnv, A>
      | Env<Kill, A>
      | Env<Kill & SchedulerEnv, A>
      | Env<Kill & CurrentFiber, A>
      | Env<Kill & CurrentFiber & SchedulerEnv, A>
      | Env<Fork & Join, A>
      | Env<Fork & Join & SchedulerEnv, A>
      | Env<Fork & Join & CurrentFiber, A>
      | Env<Fork & Join & CurrentFiber & SchedulerEnv, A>
      | Env<Fork & Kill, A>
      | Env<Fork & Kill & SchedulerEnv, A>
      | Env<Fork & Kill & CurrentFiber, A>
      | Env<Fork & Kill & CurrentFiber & SchedulerEnv, A>
      | Env<Join & Kill, A>
      | Env<Join & Kill & SchedulerEnv, A>
      | Env<Join & Kill & CurrentFiber, A>
      | Env<Join & Kill & CurrentFiber & SchedulerEnv, A>
      | Env<typeof runtime, A>
      | Env<typeof runtime & CurrentFiber, A>
      | Env<typeof runtime & SchedulerEnv, A>
      | Env<typeof runtime & CurrentFiber & SchedulerEnv, A>,
  ) => createFiber(pipe(env, useSome(runtime)), { scheduler, ...options })
}
