import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { delay } from './delay.js'
import { exhaustMapLatest } from './exhaustMapLatest.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(exhaustMapLatest.name, () => {
    const array = [1, 2, 3]

    testCollectAll(
      'merges multiple streams together, favoring the first and replaying the latest',
      exhaustMapLatest(fromArray(array), (x) => delay(fromArray([x]), Duration.millis(x * 10))),
      [1, 3],
    )
  })
})
