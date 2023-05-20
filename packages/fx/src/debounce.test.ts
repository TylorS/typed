import * as Duration from '@effect/data/Duration'
import { describe } from 'vitest'

import { debounce } from './debounce.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(debounce.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'debounces events, favoring the latest',
      debounce(fromArray(array), Duration.millis(10)),
      [array[2]],
    )
  })
})
