import { describe } from 'vitest'

import { flatMap } from './flatMap.js'
import { fromArray } from './fromArray.js'
import { slice } from './slice.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(slice.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'skips and takes the specified number of values',
      slice(fromArray(array), 1, 1),
      [array[1]],
    )

    testCollectAll(
      'works with higher-order streams',
      flatMap(fromArray([1, 2, 3]), (x) =>
        slice(fromArray([Math.random(), x, Math.random()]), 1, 1),
      ),
      [1, 2, 3],
    )
  })
})
