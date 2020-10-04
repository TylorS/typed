import * as S from '@most/scheduler'
import { Disposable, Scheduler, Task, Time } from '@most/types'
import { lazy } from '@typed/fp/Disposable/exports'
import { async, Effect, fromEnv, provideWith, Pure } from '@typed/fp/Effect/exports'
import {} from '@typed/fp/Effect/fromEnv'
import { flow } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'

/**
 * @since 0.0.1
 */
export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

export const provideSchedulerEnv = provideWith(
  Pure.fromIO(
    (): SchedulerEnv => ({
      scheduler: S.newDefaultScheduler(),
    }),
  ),
)

/**
 * Add a delay at the specified about of time
 * @since 0.0.1
 */
export const delay = (delay: Time): Effect<SchedulerEnv, Time> =>
  fromEnv(({ scheduler }: SchedulerEnv) =>
    async((cb) =>
      S.delay(
        delay,
        createCallbackTask(() => cb(S.currentTime(scheduler))),
        scheduler,
      ),
    ),
  )

/**
 * Run an IO asynchronously
 * @since 0.0.1
 */
export const asyncIO = <A>(io: IO<A>): Effect<SchedulerEnv, A> =>
  fromEnv(({ scheduler }: SchedulerEnv) =>
    async((cb) => S.delay(0, createCallbackTask(flow(io, cb)), scheduler)),
  )

/**
 * Convert an IO<Disposable> into a Most.js Task
 * @since 0.0.1
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
