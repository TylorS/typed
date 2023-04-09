import { delay } from '@typed/fx/delay'
import { exhaustMapLatestCause, exhaustMapLatestError } from '@typed/fx/exhaustMapLatestCause'
import { Duration } from '@typed/fx/externals'
import { fail } from '@typed/fx/failCause'
import { fromArray } from '@typed/fx/fromArray'
import { mergeAll } from '@typed/fx/mergeAll'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(exhaustMapLatestCause.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together when they error, favoring the first and replaying the latest',
      exhaustMapLatestError(mergeAll(...array.map((n) => fail(n))), (x) =>
        delay(fromArray([x]), Duration.millis(10)),
      ),
      [array[0], array[2]],
    )
  })
})
