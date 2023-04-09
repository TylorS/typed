import { continueWith } from '@typed/fx/continueWith'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(continueWith.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'appends one stream after another',
      continueWith(fromArray(array), () => fromArray(array)),
      [...array, ...array],
    )
  })
})
