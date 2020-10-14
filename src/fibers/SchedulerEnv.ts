import { currentTime, delay as delayScheduler, newDefaultScheduler } from '@most/scheduler'
import { Disposable, Scheduler, Task, Time } from '@most/types'
import { lazy } from '@typed/fp/Disposable/exports'
import { Effect, fromEnv, provideWith, Pure } from '@typed/fp/Effect/exports'
import { async } from '@typed/fp/Resume/exports'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'

export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

export const provideSchedulerEnv = provideWith(
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

/**
 * Convert an IO<Disposable> into a Most.js Task
 */
export function createCallbackTask(cb: IO<Disposable>, onError?: (error: Error) => void): Task {
  const disposable = lazy()

  return {
    run() {
      if (!disposable.disposed) {
        disposable.addDisposable(cb())
      }
    },
    error(_, e) {
      disposable.dispose()

      if (onError) {
        return onError(e)
      }

      throw e
    },
    dispose: disposable.dispose,
  }
}
