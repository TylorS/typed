import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { delay } from './delay.js'
import { exhaustMap } from './exhaustMap.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

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
