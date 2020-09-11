import * as S from '@most/scheduler'
import { Disposable, Scheduler, Task, Time } from '@most/types'
import { lazy } from '@typed/fp/Disposable/exports'
import { async, Effect } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { flow } from 'fp-ts/es6/function'
import { IO } from 'fp-ts/es6/IO'
/**
 * @since 0.0.1
 */
export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

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
