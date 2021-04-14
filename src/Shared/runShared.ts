import * as E from '@fp/Env'
import { CurrentFiber, Fiber, Fork, Join, Kill, runAsFiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { createGlobalRefs, GlobalRefs } from '@fp/Global'
import { SchedulerEnv } from '@fp/Scheduler'
import { Scheduler } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'

export function runShared(options: RunSharedOptions = {}) {
  const { scheduler = newDefaultScheduler(), globalRefs = createGlobalRefs() } = options

  function runShared_<A>(env: E.Env<GlobalRefs & Fork & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Fork & Join & Kill & SchedulerEnv, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Fork & Join & Kill & CurrentFiber, A>): Fiber<A>
  function runShared_<A>(
    env: E.Env<GlobalRefs & Fork & Join & Kill & SchedulerEnv & CurrentFiber, A>,
  ): Fiber<A>

  function runShared_<A>(
    env: E.Env<GlobalRefs & Fork & Join & Kill & SchedulerEnv & CurrentFiber, A>,
  ) {
    return pipe(env, E.useSome<GlobalRefs>(globalRefs), runAsFiber(scheduler))
  }

  return runShared_
}

export type RunSharedOptions = {
  readonly scheduler?: Scheduler
  readonly globalRefs?: GlobalRefs
}
