import { delay } from '@typed/fx/delay'
import { Duration } from '@typed/fx/externals'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(delay.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]
    testCollectAll('returns each the array', delay(fromArray(array), Duration.millis(0)), array)
  })
})
