import { describe } from 'vitest'

import { fromArray } from './fromArray.js'
import { mergeAll } from './mergeAll.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(mergeAll.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together',
      mergeAll(fromArray(array), fromArray(array)),
      [...array, ...array],
    )
  })
})
