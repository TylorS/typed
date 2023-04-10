import { describe } from 'vitest'

import { fromArray } from './fromArray.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(fromArray.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]
    testCollectAll('returns each the array', fromArray(array), array)
  })
})
