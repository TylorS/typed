import * as E from '@fp/Env'
import { pipe } from '@fp/function'
import * as S from '@most/scheduler'
import { Scheduler, Sink, Stream, Time } from '@most/types'

import { asks, Env } from './Env'
import { async } from './Resume'
import { createCallbackTask } from './Stream'

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
