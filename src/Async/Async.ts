import { Either, left, right } from 'fp-ts/Either'
import { flow } from 'fp-ts/function'

import { Disposable, disposeNone } from '@/Disposable'

export interface Async<R, E, A> {
  readonly type: 'Async'
  readonly runAsync: (requirements: R, cb: (either: Either<E, A>) => void) => Disposable
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
  return (r, cb): Disposable => {
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

export const fromCb = <E, A>(
  run: (cb: (either: Either<E, A>) => void) => Disposable,
): Async<unknown, E, A> => Async((_, cb) => run(cb))

export const fromCbRight = <A>(run: (cb: (a: A) => void) => Disposable): Async<unknown, never, A> =>
  fromCb((cb) => run(flow(right, cb)))

export const fromCbLeft = <E>(run: (cb: (e: E) => void) => Disposable): Async<unknown, E, never> =>
  fromCb((cb) => run(flow(left, cb)))
