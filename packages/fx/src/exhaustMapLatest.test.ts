import { delay } from '@typed/fx/delay'
import { exhaustMapLatest } from '@typed/fx/exhaustMapLatest'
import { Duration } from '@typed/fx/externals'
import { fromArray } from '@typed/fx/fromArray'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(exhaustMapLatest.name, () => {
    const array = [1, 2, 3]

    testCollectAll(
      'merges multiple streams together, favoring the first and replaying the latest',
      exhaustMapLatest(fromArray(array), (x) => delay(fromArray([x]), Duration.millis(x * 10))),
      [1, 3],
    )
  })
})
