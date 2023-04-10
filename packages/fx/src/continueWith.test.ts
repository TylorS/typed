import { describe } from 'vitest'

import { continueWith } from './continueWith.js'
import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(continueWith.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'appends one stream after another',
      continueWith(fromArray(array), () => fromArray(array)),
      [...array, ...array],
    )
  })
})
