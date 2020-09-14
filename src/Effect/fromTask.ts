import { lazy } from '@typed/fp/Disposable/exports'
import { Task } from 'fp-ts/Task'

import { async, Pure } from './Effect'
import { fromEnv } from './fromEnv'

/**
 * Converts a PromiseLike to a Pure. Does not handle errors from your promise, if this is required
 * try using Either or another more expressive type.
 *
 * @since 0.0.1
 * @example
 *
 * fromPromise(() => import('@typed/fp'))
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
