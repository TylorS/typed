import { describe } from 'vitest'

import { delay } from './delay.js'
import { Duration } from './externals.js'
import { fail } from './failCause.js'
import { fromArray } from './fromArray.js'
import { mergeAll } from './mergeAll.js'
import { switchMapCause, switchMapError } from './switchMapCause.js'
import { testCollectAll } from './test-utils.js'

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
