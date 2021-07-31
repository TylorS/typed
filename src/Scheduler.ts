/**
 * @typed/fp/Scheduler is an extension of @most/scheduler with additional
 * combinators and integration with Env.
 * @since 0.9.2
 */

import * as S from '@most/scheduler'
import { Scheduler, Sink, Stream, Time } from '@most/types'

import * as E from './Env'
import { asks, Env } from './Env'
import { pipe } from './function'
import { async } from './Resume'
import { createCallbackTask } from './Stream'

/**
 * @since 0.9.2
 * @category Environment
 */
export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const delay =
  (ms: Time): Env<SchedulerEnv, Time> =>
  ({ scheduler }) =>
    async((resume) =>
      S.delay(
        ms,
        createCallbackTask(() => resume(scheduler.currentTime())),
        scheduler,
      ),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getScheduler = asks((e: SchedulerEnv) => e.scheduler)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const runStream = <A>(sink: Sink<A>, stream: Stream<A>) =>
  pipe(
    getScheduler,
    E.map((scheduler) => stream.run(sink, scheduler)),
  )

export * from '@most/scheduler'
