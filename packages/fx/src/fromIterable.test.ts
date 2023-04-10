import { describe } from 'vitest'

import { fromIterable } from './fromIterable.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(fromIterable.name, () => {
    const set = new Set([Math.random(), Math.random(), Math.random()])
    testCollectAll('returns each the array', fromIterable(set), Array.from(set))
  })
})
