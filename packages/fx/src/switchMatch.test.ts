import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { delay } from './delay.js'
import { fail } from './failCause.js'
import { fromArray } from './fromArray.js'
import { mergeAll } from './mergeAll.js'
import { succeed } from './succeed.js'
import { switchMatch } from './switchMatch.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(switchMatch.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together, handling errors and successes, favoring the latest',
      switchMatch(
        mergeAll(succeed(array[0]), fail(array[1]), succeed(array[2])),
        (x) => delay(fromArray([x]), Duration.millis(10)),
        (x) => delay(fromArray([x]), Duration.millis(10)),
      ),
      [array[2]],
    )
  })
})
