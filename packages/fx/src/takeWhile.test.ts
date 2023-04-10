import { describe } from 'vitest'

import { fromArray } from './fromArray.js'
import { takeUntil, takeWhile } from './takeWhile.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(takeWhile.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'takes values until the predicate returns false',
      takeWhile(fromArray(array), (x) => x !== array[2]),
      [array[0], array[1]],
    )
  })

  describe(takeUntil.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'takes values while the predicate returns true',
      takeUntil(fromArray(array), (x) => x === array[2]),
      [array[0], array[1]],
    )
  })
})
