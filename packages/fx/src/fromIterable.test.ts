import { fromIterable } from '@typed/fx/fromIterable'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(fromIterable.name, () => {
    const set = new Set([Math.random(), Math.random(), Math.random()])
    testCollectAll('returns each the array', fromIterable(set), Array.from(set))
  })
})
