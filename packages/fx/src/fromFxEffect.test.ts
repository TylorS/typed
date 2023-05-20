import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { describe } from 'vitest'

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
