import { currentTime, delay as delayScheduler, newDefaultScheduler } from '@most/scheduler'
import { Scheduler, Time } from '@most/types'
import { Effect, fromEnv, Provider, provideWith, Pure } from '@typed/fp/Effect/exports'
import { async } from '@typed/fp/Resume/exports'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'

import { createCallbackTask } from './createCallbackTask'

/**
 * An environment type for accessing a Scheduler
 */
export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

/**
 * Provide an Effect with a SchedulerEnv
 */
export const provideSchedulerEnv: Provider<SchedulerEnv> = provideWith(
  Pure.fromIO(
    (): SchedulerEnv => ({
      scheduler: newDefaultScheduler(),
    }),
  ),
)

/**
 * Add a delay at the specified about of time
 */
export const delay = (delay: Time): Effect<SchedulerEnv, Time> =>
  fromEnv(({ scheduler }: SchedulerEnv) =>
    async((cb) =>
      delayScheduler(
        delay,
        createCallbackTask(() => cb(currentTime(scheduler))),
        scheduler,
      ),
    ),
  )

/**
 * Run an IO asynchronously
 */
export const asyncIO = <A>(io: IO<A>): Effect<SchedulerEnv, A> =>
  fromEnv(({ scheduler }: SchedulerEnv) =>
    async((cb) => delayScheduler(0, createCallbackTask(flow(io, cb)), scheduler)),
  )
