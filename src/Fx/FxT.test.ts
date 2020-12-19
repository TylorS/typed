import { describe, given, it } from '@typed/test'
import { either, right } from 'fp-ts/Either'

import { getStackSafeFxM } from './FxT'

export const test = describe(`FxT`, [
  given(`Either Monad`, [
    it(`allows do-notation`, ({ equal }) => {
      const a = 1
      const b = 2

      const { toMonad, doMonad } = getStackSafeFxM(either)
      const doNotation = doMonad(function* (lift) {
        const x = yield* lift(right<Error, number>(a))
        const y = yield* lift(right<Error, number>(b))

        return x + y
      })

      equal(right(a + b), toMonad(doNotation))
    }),
  ]),
])
