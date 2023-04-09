import { fromArray } from '@typed/fx/fromArray'
import { skipUntil, skipWhile } from '@typed/fx/skipWhile'
import { testCollectAll } from '@typed/fx/test-utils'

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
