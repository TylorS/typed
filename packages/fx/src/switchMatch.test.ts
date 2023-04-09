import { delay } from '@typed/fx/delay'
import { Duration } from '@typed/fx/externals'
import { fail } from '@typed/fx/failCause'
import { fromArray } from '@typed/fx/fromArray'
import { mergeAll } from '@typed/fx/mergeAll'
import { succeed } from '@typed/fx/succeed'
import { switchMatch } from '@typed/fx/switchMatch'
import { testCollectAll } from '@typed/fx/test-utils'

describe(__filename, () => {
  describe(switchMatch.name, () => {
    const array = [Math.random(), Math.random(), Math.random()]

    testCollectAll(
      'merges multiple streams together, handling errors and successes, favoring the latest',
      switchMatch(
        mergeAll(succeed(array[0]), fail(array[1]), succeed(array[2])),
        (x) => delay(fromArray([x]), Duration.millis(10)),
        (x) => delay(fromArray([x]), Duration.millis(10)),
      ),
      [array[2]],
    )
  })
})
