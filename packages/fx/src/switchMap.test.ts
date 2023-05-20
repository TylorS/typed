import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { delay } from './delay.js'
import { fromArray } from './fromArray.js'
import { switchMap } from './switchMap.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(switchMap.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together, favoring the latest',
      switchMap(fromArray(array), (x) => delay(fromArray([x]), Duration.millis(10))),
      [array[2]],
    )
  })
})
