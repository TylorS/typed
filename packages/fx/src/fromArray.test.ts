import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(fromArray.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]
    testCollectAll('returns each the array', fromArray(array), array)
  })
})
