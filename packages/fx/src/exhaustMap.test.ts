import { delay } from '@typed/fx/delay'
import { exhaustMap } from '@typed/fx/exhaustMap'
import { Duration } from '@typed/fx/externals'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(exhaustMap.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together, favoring the first',
      exhaustMap(fromArray(array), (x) => delay(fromArray([x]), Duration.millis(10))),
      [array[0]],
    )
  })
})
