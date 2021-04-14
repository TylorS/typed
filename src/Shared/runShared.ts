import * as E from '@fp/Env'
import { CurrentFiber, Fiber, Fork, Join, Kill, runAsFiber } from '@fp/Fiber'
import { pipe } from '@fp/function'
import { createGlobalRefs, GlobalRefs } from '@fp/Global'
import { SchedulerEnv } from '@fp/Scheduler'
import { Scheduler } from '@fp/Stream'
import { newDefaultScheduler } from '@most/scheduler'

export function runShared(options: RunSharedOptions = {}) {
  const { scheduler = newDefaultScheduler(), globalRefs = createGlobalRefs() } = options

  function runShared_<A>(env: E.Env<GlobalRefs, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber, A>): Fiber<A>

  function runShared_<A>(env: E.Env<Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<Fork & Join & Kill, A>): Fiber<A>

  function runShared_<A>(env: E.Env<GlobalRefs & Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & Fork & Join & Kill, A>): Fiber<A>

  function runShared_<A>(env: E.Env<SchedulerEnv & Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & Fork & Join & Kill, A>): Fiber<A>

  function runShared_<A>(env: E.Env<CurrentFiber & Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber & Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber & Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<CurrentFiber & Fork & Join & Kill, A>): Fiber<A>

  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & SchedulerEnv & Fork & Join & Kill, A>): Fiber<A>

  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<GlobalRefs & CurrentFiber & Fork & Join & Kill, A>): Fiber<A>

  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Fork, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Fork & Join, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Fork & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Join & Kill, A>): Fiber<A>
  function runShared_<A>(env: E.Env<SchedulerEnv & CurrentFiber & Fork & Join & Kill, A>): Fiber<A>

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
