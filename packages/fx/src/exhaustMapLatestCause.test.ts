import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { delay } from './delay.js'
import { exhaustMapLatestCause, exhaustMapLatestError } from './exhaustMapLatestCause.js'
import { fail } from './failCause.js'
import { fromArray } from './fromArray.js'
import { mergeAll } from './mergeAll.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(exhaustMapLatestCause.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together when they error, favoring the first and replaying the latest',
      exhaustMapLatestError(mergeAll(...array.map((n) => fail(n))), (x) =>
        delay(fromArray([x]), Duration.millis(10)),
      ),
      [array[0], array[2]],
    )
  })
})
