import { describe } from 'vitest'

import { delay } from './delay.js'
import { Duration } from './externals.js'
import { flatMap } from './flatMap.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

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
