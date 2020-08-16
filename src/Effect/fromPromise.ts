import { lazy } from '@typed/fp/Disposable'
import { async, Pure } from '@typed/fp/Effect/Effect'
import { fromEnv } from '@typed/fp/Effect/fromEnv'
import { IO } from 'fp-ts/es6/IO'

/**
 * Converts a PromiseLike to a Pure. Does not handle errors from your promise, if this is required
 * try using Either or another more expressive type.
 *
 * @since 0.0.1
 * @example
 *
 * fromPromise(() => import('@typed/fp'))
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
