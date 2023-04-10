import { describe } from 'vitest'

import { fromArray } from './fromArray.js'
import { map } from './map.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(map.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'transforms the values of the stream',
      map(fromArray(array), (x) => x + 1),
      array.map((x) => x + 1),
    )
  })
})
