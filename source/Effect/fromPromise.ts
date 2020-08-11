import { lazy } from '@typed/fp/Disposable'
import { async, Pure } from './Effect'
import { fromEnv } from './fromEnv'

/**
 * Converts a PromiseLike to a Pure. Does not handle errors from your promise
 */
export function fromPromise<A>(f: () => PromiseLike<A>): Pure<A> {
  return fromEnv(() =>
    async((cb) => {
      const disposable = lazy()

      f().then((a) => !disposable.disposed && disposable.addDisposable(cb(a)))

      return disposable
    }),
  )
}
