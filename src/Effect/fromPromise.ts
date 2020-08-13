import { lazy } from '@typed/fp/Disposable'
import { async, Pure, Effect } from './Effect'
import { fromEnv } from './fromEnv'
import { IO } from 'fp-ts/es6/IO'

/**
 * Converts a PromiseLike to a Pure. Does not handle errors from your promise, if this is required
 * try using Either or another more expressive type.
 *
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

/**
 * Create a Pure instance with the help of an AbortSignal, particularly helpful for using fetch.
 *
 * @example
 * withAbortSignal((signal) => fetch(URL, { signal }))
 */
export function withAbortSignal<A>(
  f: (signal: AbortSignal) => PromiseLike<A>,
): Effect<{ readonly createAbortController: () => AbortController }, A> {
  return fromEnv(({ createAbortController }) =>
    async((cb) => {
      const disposable = lazy()
      const controller = createAbortController()

      disposable.addDisposable({ dispose: () => controller.abort() })

      f(controller.signal).then((a) => !disposable.disposed && disposable.addDisposable(cb(a)))

      return disposable
    }),
  )
}
