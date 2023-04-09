import { Cause, Effect } from '@typed/fx/externals'
import { fromEmitter } from '@typed/fx/fromEmitter'
import { testCause, testCollectAll } from '@typed/fx/test-utils'

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
