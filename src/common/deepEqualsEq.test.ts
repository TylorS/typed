import { describe, given, it, Test } from '@typed/test'

import { deepEqualsEq } from './deepEqualsEq'

export const test: Test = describe(`deepEqualsEq`, [
  given(`given two arrays with equal values`, [
    it(`returns true`, ({ ok }) => {
      const a = [0, 1, 2, 3]
      const b = [0, 1, 2, 3]

      ok(deepEqualsEq.equals(a, b))
    }),
  ]),
])
