import { doEffect, execEffect, Pure } from '@typed/fp/Effect'
import { createBrowserUuidEnv } from '@typed/fp/Uuid'
import { createVirtualScheduler } from '@typed/fp/VirtualTimer'
import { describe, given, it } from '@typed/test'
import { identity, increment, pipe } from 'fp-ts/es6/function'

import { getKeyedRequirements, runWithHooks, useState } from '../domain'
import { provideHookOps, provideHooksManagerEnv } from '../infrastructure'
import { useEffectBy } from './useEffectBy'
import { useInterval } from './useInterval'

export const test = describe(`useEffectBy`, [
  given(`a list, a function to a reusable key, and a hook computation`, [
    it(`returns the values of the hook computation applied to a diff of the list`, ({
      equal,
    }, done) => {
      const i = 1000

      const [timer, scheduler] = createVirtualScheduler()

      const Counter = (initial: number) =>
        doEffect(function* () {
          const [getCount, updateCount] = yield* useState(Pure.of(initial))

          yield* useInterval(updateCount(increment), i)

          return yield* getCount
        })

      const sut = doEffect(function* sut() {
        try {
          const env = yield* getKeyedRequirements({ test: 'key' })
          let values = yield* runWithHooks(useEffectBy([], identity, Counter), env)
          equal([], values)
          values = yield* runWithHooks(useEffectBy([1], identity, Counter), env)
          // Allow interval to "start"
          timer.progressTimeBy(1)
          equal([1], values)
          // Allow interval to tick once
          timer.progressTimeBy(i)
          // Check to see that it keeps the state for '1' and creates a new environment for '3'
          values = yield* runWithHooks(useEffectBy([1, 3], identity, Counter), env)
          equal([2, 3], values)
          done()
        } catch (error) {
          console.error(error)
          done(error)
        }
      })

      pipe(
        sut,
        provideHookOps,
        provideHooksManagerEnv,
        execEffect({ scheduler, ...createBrowserUuidEnv() }),
      )
    }),
  ]),
])
