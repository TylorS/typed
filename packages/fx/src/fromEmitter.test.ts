import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { describe } from 'vitest'

import { fromEmitter } from './fromEmitter.js'
import { testCause, testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(fromEmitter.name, () => {
    testCollectAll(
      'returns each value emitted',
      fromEmitter((emitter) =>
        Effect.sync(() => {
          emitter.event(1)
          emitter.event(2)
          emitter.event(3)
          emitter.end()
        }),
      ),
      [1, 2, 3],
    )

    testCause(
      'fails with the given Cause',
      fromEmitter((emitter) =>
        Effect.sync(() => {
          emitter.error(Cause.fail(1))
        }),
      ),
      Cause.fail(1),
    )
  })
})
