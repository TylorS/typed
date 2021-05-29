import * as E from '@fp/Env'
import { asks, Env } from '@fp/Env'
import { pipe } from '@fp/function'
import { async } from '@fp/Resume'
import { createCallbackTask } from '@fp/Stream'
import * as S from '@most/scheduler'
import { Scheduler, Sink, Stream, Time } from '@most/types'

export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

export const delay = (ms: Time): Env<SchedulerEnv, Time> => ({ scheduler }) =>
  async((resume) =>
    S.delay(
      ms,
      createCallbackTask(() => resume(scheduler.currentTime())),
      scheduler,
    ),
  )

export const getScheduler = asks((e: SchedulerEnv) => e.scheduler)

export const runStream = <A>(sink: Sink<A>, stream: Stream<A>) =>
  pipe(
    getScheduler,
    E.map((scheduler) => stream.run(sink, scheduler)),
  )
