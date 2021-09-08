import { Either, left, right } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { Disposable, disposeNone } from '@/Disposable'

export interface Async<R, E, A> {
  readonly type: 'Async'
  readonly runAsync: (requirements: R, cb: (either: Either<E, A>) => void) => Disposable<any>
}

export type RequirementsOf<A> = [A] extends [Async<infer R, any, any>] ? R : never

export type ErrorOf<A> = [A] extends [Async<any, infer R, any>] ? R : never

export type ValueOf<A> = [A] extends [Async<any, any, infer R>] ? R : never

export const Async = <R, E, A>(runAsync: Async<R, E, A>['runAsync']): Async<R, E, A> => ({
  type: 'Async',
  runAsync: once(runAsync),
})

// Ensure that any Async can only resolve once
function once<R, E, A>(runAsync: Async<R, E, A>['runAsync']): Async<R, E, A>['runAsync'] {
  return (r, cb): Disposable<any> => {
    let ran = false

    return runAsync(r, (either) => {
      if (ran) {
        return disposeNone()
      }

      ran = true

      return cb(either)
    })
  }
}

export const fromCbEither = <E, A>(
  run: (cb: (either: Either<E, A>) => void) => Disposable<any>,
): Async<unknown, E, A> => Async((_, cb) => run(cb))

export const fromCb = <A>(run: (cb: (a: A) => void) => Disposable<any>): Async<unknown, never, A> =>
  fromCbEither((cb) => run(flow(right, cb)))

export const fromCbL = <E>(
  run: (cb: (e: E) => void) => Disposable<any>,
): Async<unknown, E, never> => fromCbEither((cb) => run(flow(left, cb)))
