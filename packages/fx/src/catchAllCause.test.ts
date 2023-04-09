import { catchAll, catchAllCause } from '@typed/fx/catchAllCause'
import { delay } from '@typed/fx/delay'
import { Duration } from '@typed/fx/externals'
import { fail } from '@typed/fx/failCause'
import { fromArray } from '@typed/fx/fromArray'
import { mergeAll } from '@typed/fx/mergeAll'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(catchAllCause.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together when they error, infinite concurrency',
      catchAll(mergeAll(...array.map((n) => fail(n))), (x) =>
        delay(fromArray([x]), Duration.millis(10)),
      ),
      array,
    )
  })
})
