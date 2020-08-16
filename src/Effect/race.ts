import { disposeBoth } from '@typed/fp/Disposable'
import { curry } from '@typed/fp/lambda'

import { async, Effect } from './Effect'
import { fromEnv } from './fromEnv'
import { runResume } from './runResume'
import { toEnv } from './toEnv'

export const race = curry(
  <E1, A, E2, B>(a: Effect<E1, A>, b: Effect<E2, B>): Effect<E1 & E2, A | B> =>
    fromEnv((e) => {
      const aResume = toEnv(a)(e)
      const bResume = toEnv(b)(e)

      if (!aResume.async) {
        return aResume
      }

      if (!bResume.async) {
        return bResume
      }

      return async((cb) => disposeBoth(runResume(aResume, cb), runResume(bResume, cb)))
    }),
) as {
  <E1, A, E2, B>(a: Effect<E1, A>, b: Effect<E2, B>): Effect<E1 & E2, A | B>
  <E1, A>(a: Effect<E1, A>): <E2, B>(b: Effect<E2, B>) => Effect<E1 & E2, A | B>
}
