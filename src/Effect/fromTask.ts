import { lazy } from '@typed/fp/Disposable/exports'
import { async } from '@typed/fp/Resume/exports'
import { Task } from 'fp-ts/Task'

import { fromEnv, Pure } from './Effect'

/**
 * Converts a Task into an Effect. Does not handle errors from your promise, if this is required
 * try using Either or another more expressive type.
 *
 * @example
 * fromTask(() => import('@typed/fp'))
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
