import { delay } from '@typed/fx/delay'
import { Duration } from '@typed/fx/externals'
import { flatMap } from '@typed/fx/flatMap'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(flatMap.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together, infinite concurrency',
      flatMap(fromArray(array), (x) => delay(fromArray([x]), Duration.millis(10))),
      array,
    )
  })
})
