import * as S from '@most/scheduler'
import { Scheduler, Time } from '@most/types'

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
