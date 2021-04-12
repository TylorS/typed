import * as F from '@fp/Fiber'
import { pipe } from '@fp/function'
import { Do } from '@fp/Fx/Env'
import { describe, given, it } from '@typed/test'
import { createVirtualScheduler } from 'most-virtual-scheduler'
import { EOL } from 'os'

import { formatWinsAndLosses } from './formatWinsAndLosses'
import { lost } from './Losses'
import { won } from './Wins'

export const test = describe(`formatWinsAndLosses`, [
  given(`Refs with Wins and Losses`, [
    it(`returns the expected format`, ({ equal }) => {
      const test = Do(function* (_) {
        equal(`${EOL}W ${0} | L ${0} | T ${0}`, yield* _(formatWinsAndLosses))

        yield* _(won)
        yield* _(won)

        equal(`${EOL}W ${2} | L ${0} | T ${2}`, yield* _(formatWinsAndLosses))

        yield* _(lost)

        equal(`${EOL}W ${2} | L ${1} | T ${3}`, yield* _(formatWinsAndLosses))
      })

      const [timer, scheduler] = createVirtualScheduler()

      pipe(test, F.withFiberRefs, F.runAsFiber(scheduler))

      timer.progressTimeBy(1)
    }),
  ]),
])
