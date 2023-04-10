import { describe } from 'vitest'

import { Cause, Effect } from './externals.js'
import { fromFxEffect } from './fromFxEffect.js'
import { succeed } from './succeed.js'
import { testCause, testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(fromFxEffect.name, (): void => {
    const value = Math.random()

    testCollectAll('returns the output', fromFxEffect(Effect.succeed(succeed(value))), [value])

    testCause('fails with the given Cause', fromFxEffect(Effect.fail(value)), Cause.fail(value))
  })
})
