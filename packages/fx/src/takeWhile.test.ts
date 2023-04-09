import { fromArray } from '@typed/fx/fromArray'
import { takeUntil, takeWhile } from '@typed/fx/takeWhile'
import { testCollectAll } from '@typed/fx/test-utils'

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
