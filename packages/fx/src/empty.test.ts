import { describe } from 'vitest'

import { empty } from './empty.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(empty.name, () => {
    testCollectAll('immediately ends', empty(), [])
  })
})
