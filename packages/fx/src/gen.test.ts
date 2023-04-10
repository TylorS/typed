import { describe } from 'vitest'

import { Cause, Effect } from './externals.js'
import { gen } from './gen.js'
import { succeed } from './succeed.js'
import { testCause, testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(gen.name, () => {
    const value = Math.random()

    testCollectAll(
      'returns the output',
      // eslint-disable-next-line require-yield
      gen(function* () {
        return succeed(value)
      }),
      [value],
    )

    testCause(
      'fails with the given Cause',
      gen(function* ($) {
        return yield* $(Effect.fail(value))
      }),
      Cause.fail(value),
    )
  })
})
