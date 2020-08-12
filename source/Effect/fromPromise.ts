import { lazy } from '@typed/fp/Disposable'
import { async, Pure } from './Effect'
import { fromEnv } from './fromEnv'
import { IO } from 'fp-ts/es6/IO'

/**
 * Converts a PromiseLike to a Pure. Does not handle errors from your promise
 */
export function fromPromise<A>(io: IO<PromiseLike<A>>): Pure<A> {
  return fromEnv(() =>
    async((cb) => {
      const disposable = lazy()

      io().then((a) => !disposable.disposed && disposable.addDisposable(cb(a)))

      return disposable
    }),
  )
}
