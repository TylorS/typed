import { lazy } from '@typed/fp/Disposable/exports'
import { async, Pure } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { Task } from 'fp-ts/es6/Task'

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
