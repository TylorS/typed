import { debounce } from '@typed/fx/debounce'
import { Duration } from '@typed/fx/externals'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(debounce.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'debounces events, favoring the latest',
      debounce(fromArray(array), Duration.millis(10)),
      [array[2]],
    )
  })
})
