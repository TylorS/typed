import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import * as R from '@fp/Resume'
import { describe, given, it } from '@typed/test'
import { askForMax } from 'Max'

export const test = describe(`Max`, [
  describe(`askForMax`, [
    given(`the answer can be parsed as an integer`, [
      it(`returns the parsed integer`, ({ equal }) => {
        const value = 43
        const test = Do(function* (_) {
          const max = yield* _(askForMax)

          equal(value, max)
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
