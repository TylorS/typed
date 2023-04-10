import { describe } from 'vitest'

import { Duration } from './externals.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'
import { throttle } from './throttle.js'

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
