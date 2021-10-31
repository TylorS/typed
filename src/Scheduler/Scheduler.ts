import * as Clock from '@/Clock'
import type { Context } from '@/Context'
import { Fiber } from '@/Fiber'
import { Fx } from '@/Fx'
import { LocalScope } from '@/Scope'

export interface Scheduler extends Clock.Clock {
  readonly delay: <R, A>(
    fx: Fx<R, A>,
    delay: Clock.Time,
    options: ScheduleOptions<R, A>,
  ) => Fiber<A>

  readonly periodic: <R, A>(
    fx: Fx<R, A>,
    period: Clock.Time,
    options: ScheduleOptions<R, any>,
  ) => Fiber<never>
}

export interface ScheduleOptions<R, A> {
  readonly scope: LocalScope<R, A>
  readonly context: Context
}

export function relative(scheduler: Scheduler): Scheduler {
  return {
    ...scheduler,
    ...Clock.relative(scheduler, scheduler.getCurrentTime()),
  }
}
