import { Duration } from '@typed/fx/externals'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'
import { throttle } from '@typed/fx/throttle'

describe(__filename, () => {
  describe(throttle.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'throttles events, favoring the first',
      throttle(fromArray(array), Duration.millis(10)),
      [array[0]],
    )
  })
})
