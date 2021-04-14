import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Resume'
import { describe, given, it } from '@typed/test'

import { askForMin } from './Min'

export const test = describe(`Min`, [
  describe(`askForMin`, [
    given(`the answer can be parsed as an integer`, [
      it(`returns the parsed integer`, ({ equal }) => {
        const value = 43
        const test = Do(function* (_) {
          const min = yield* _(askForMin)

          equal(value, min)
        })

        pipe(
          {
            getStr: R.of(`${value}`),
            putStr: () => R.of(void 0),
          },
          test,
        )
      }),
    ]),
  ]),
])
