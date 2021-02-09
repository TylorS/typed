import { describe, given, it } from '@typed/test'

import { uncurry } from './uncurry'

export const test = describe(`uncurry`, [
  given(`a curried function`, [
    it(`returns the uncurried version of it`, ({ equal }) => {
      const f = (a: number) => (b: number, c: number) => (d: number) => a + b + c + d
      const g = uncurry(f)

      equal(4, g(1, 1, 1, 1))
    }),
  ]),
])
