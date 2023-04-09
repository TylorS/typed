import { delay } from '@typed/fx/delay'
import { Duration } from '@typed/fx/externals'
import { fail } from '@typed/fx/failCause'
import { fromArray } from '@typed/fx/fromArray'
import { mergeAll } from '@typed/fx/mergeAll'
import { switchMapCause, switchMapError } from '@typed/fx/switchMapCause'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(switchMapCause.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together when they error, favoring the latest',
      switchMapError(mergeAll(...array.map((n) => fail(n))), (x) =>
        delay(fromArray([x]), Duration.millis(10)),
      ),
      [array[2]],
    )
  })
})
