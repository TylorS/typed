import { fromArray } from '@typed/fx/fromArray'
import { mergeAll } from '@typed/fx/mergeAll'
import { testCollectAll } from '@typed/fx/test-utils'

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
