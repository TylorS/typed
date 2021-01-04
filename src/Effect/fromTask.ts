import { lazy } from '@fp/Disposable/exports'
import { async } from '@fp/Resume/exports'
import { Task } from 'fp-ts/Task'

import { fromEnv, Pure } from './Effect'

/**
 * Converts a Task into an Effect. Does not handle errors from your promise, if this is required
 * try using Either or another more expressive type.
 *
 * @example
 * fromTask(() => import('@fp'))
 */
export function fromTask<A>(task: Task<A>): Pure<A> {
  return fromEnv(() =>
    async((cb) => {
      const disposable = lazy()

      task().then((a) => !disposable.disposed && disposable.addDisposable(cb(a)))

      return disposable
    }),
  )
}
