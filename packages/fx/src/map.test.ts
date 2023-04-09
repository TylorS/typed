import { fromArray } from '@typed/fx/fromArray'
import { map } from '@typed/fx/map'
import { testCollectAll } from '@typed/fx/test-utils'

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
