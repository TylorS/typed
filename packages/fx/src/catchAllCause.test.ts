import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { catchAll, catchAllCause } from './catchAllCause.js'
import { delay } from './delay.js'
import { fail } from './failCause.js'
import { fromArray } from './fromArray.js'
import { mergeAll } from './mergeAll.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(catchAllCause.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together when they error, infinite concurrency',
      catchAll(mergeAll(...array.map((n) => fail(n))), (x) =>
        delay(fromArray([x]), Duration.millis(10)),
      ),
      array,
    )
  })
})
