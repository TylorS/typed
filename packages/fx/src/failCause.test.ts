import * as Cause from '@effect/io/Cause'
import * as FiberId from '@effect/io/Fiber/Id'
import { describe } from 'vitest'

import { failCause } from './failCause.js'
import { testCause } from './test-utils.js'

describe(__filename, () => {
  describe(failCause.name, () => {
    for (const cause of [
      Cause.fail(1),
      Cause.die(1),
      Cause.empty,
      Cause.interrupt(FiberId.make(0, 0)),
      Cause.sequential(Cause.interrupt(FiberId.make(0, 0)), Cause.fail(2)),
      Cause.parallel(Cause.interrupt(FiberId.make(0, 0)), Cause.fail(2)),
    ]) {
      testCause('fails with the given Cause', failCause(cause), cause)
    }
  })
})
