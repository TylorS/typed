import { describe } from 'vitest'

import { delay } from './delay.js'
import { Duration } from './externals.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(delay.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]
    testCollectAll('returns each the array', delay(fromArray(array), Duration.millis(0)), array)
  })
})
