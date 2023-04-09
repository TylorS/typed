import { delay } from '@typed/fx/delay'
import { Duration } from '@typed/fx/externals'
import { fromArray } from '@typed/fx/fromArray'
import { switchMap } from '@typed/fx/switchMap'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(switchMap.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together, favoring the latest',
      switchMap(fromArray(array), (x) => delay(fromArray([x]), Duration.millis(10))),
      [array[2]],
    )
  })
})
