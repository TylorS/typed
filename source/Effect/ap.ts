import { Arity1 } from '@typed/fp/common'
import { disposeBoth, disposeNone } from '@typed/fp/Disposable'
import { curry } from '@typed/fp/lambda'
import { isNone, none, Option, some } from 'fp-ts/es6/Option'
import { chain } from './chain'
import { async, Effect } from './Effect'
import { fromEnv } from './fromEnv'
import { map } from './map'
import { runResume } from './runResume'
import { toEnv } from './toEnv'

export const ap = curry(
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B> => {
    const fnEnv = toEnv(fn)
    const valueEnv = toEnv(value)

    return fromEnv((e: E1 & E2) => {
      const fnResume = fnEnv(e)
      const valueResume = valueEnv(e)

      return async((cb) => {
        let f: Option<Arity1<A, B>> = none
        let v: Option<A> = none

        const onValue = () => {
          if (isNone(f) || isNone(v)) {
            return disposeNone()
          }

          return cb(f.value(v.value))
        }

        return disposeBoth(
          runResume(fnResume, (ab) => {
            f = some(ab)

            return onValue()
          }),
          runResume(valueResume, (a) => {
            v = some(a)

            return onValue()
          }),
        )
      })
    })
  },
) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}

export const apSeq = curry(
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B> =>
    chain((f) => map(f, value), fn),
) as {
  <E1, A, B, E2>(fn: Effect<E1, Arity1<A, B>>, value: Effect<E2, A>): Effect<E1 & E2, B>
  <E1, A, B>(fn: Effect<E1, Arity1<A, B>>): <E2>(value: Effect<E2, A>) => Effect<E1 & E2, B>
}
