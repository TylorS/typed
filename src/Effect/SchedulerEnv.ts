import { Scheduler, Disposable, Task } from '@most/types'
import * as S from '@most/scheduler'
import { lazy } from '@typed/fp/Disposable'
import { fromEnv } from './fromEnv'
import { async, Effect } from './Effect'
import { IO } from 'fp-ts/es6/IO'
import { flow } from 'fp-ts/es6/function'

export interface SchedulerEnv {
  readonly scheduler: Scheduler
}

export const delay = (delay: number) =>
  fromEnv(({ scheduler }: SchedulerEnv) =>
    async((cb) =>
      S.delay(
        delay,
        createCallbackTask(() => cb(S.currentTime(scheduler))),
        scheduler,
      ),
    ),
  )

export const asyncIO = <A>(io: IO<A>): Effect<SchedulerEnv, A> =>
  fromEnv(({ scheduler }: SchedulerEnv) =>
    async((cb) => S.delay(0, createCallbackTask(flow(io, cb)), scheduler)),
  )

export function createCallbackTask(cb: () => Disposable): Task {
  const disposable = lazy()

  return {
    run() {
      if (!disposable.disposed) {
        disposable.addDisposable(cb())
      }
    },
    error(_, e) {
      disposable.dispose()

      throw e
    },
    dispose: disposable.dispose,
  }
}
