import { describe } from 'vitest'

import { fromArray } from './fromArray.js'
import { skipUntil, skipWhile } from './skipWhile.js'
import { testCollectAll } from './test-utils.js'

describe(__filename, () => {
  describe(skipWhile.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'skips values until the predicate returns false',
      skipWhile(fromArray(array), (x) => x !== array[2]),
      [array[2]],
    )
  })

  describe(skipUntil.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'skips values while the predicate returns true',
      skipUntil(fromArray(array), (x) => x === array[2]),
      [array[2]],
    )
  })
})
