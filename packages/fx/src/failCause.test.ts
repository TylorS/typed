import { Cause, FiberId } from '@typed/fx/externals'
import { failCause } from '@typed/fx/failCause'
import { testCause } from '@typed/fx/test-utils'

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
