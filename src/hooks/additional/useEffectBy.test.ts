import { doEffect, provide, Pure } from '@typed/fp/Effect/exports'
import { runAsFiberWith } from '@typed/fp/fibers/exports'
import { provideUuidEnv } from '@typed/fp/Uuid/exports'
import { createVirtualScheduler } from '@typed/fp/VirtualTimer/exports'
import { describe, given, it } from '@typed/test'
import { identity, increment, pipe } from 'fp-ts/function'

import {
  getKeyedEnvironment,
  getState,
  provideEmptyHookStates,
  provideHookEnv,
  runWithHooks,
  updateState,
  useState,
} from '../core/exports'
import { useEffectBy } from './useEffectBy'
import { TimerEnv } from './useInterval'
import { useIntervalEffect } from './useIntervalEffect'

export const test = describe(`useEffectBy`, [
  given(`a list, a function to a reusable key, and a hook computation`, [
    it(`returns the values of the hook computation applied to a diff of the list`, ({
      equal,
    }, done) => {
      const i = 1000

      const [timer, scheduler] = createVirtualScheduler()

      const Counter = (initial: number) => {
        const eff = doEffect(function* () {
          const count = yield* useState(Pure.of(initial))
          const value = yield* getState(count)

          yield* useIntervalEffect(() => updateState(increment, count), i)

          return value
        })

        return eff
      }

      const sut = doEffect(function* sut() {
        try {
          const env = yield* getKeyedEnvironment({ test: 'key' })
          let values = yield* runWithHooks(env, useEffectBy([], identity, Counter))
          equal([], values)
          values = yield* runWithHooks(env, useEffectBy([1], identity, Counter))
          // Allow interval to "start"
          timer.progressTimeBy(1)
          equal([1], values)
          // Allow interval to tick once
          timer.progressTimeBy(i)

          // Check to see that it keeps the state for '1' and creates a new environment for '3'
          values = yield* runWithHooks(env, useEffectBy([1, 3], identity, Counter))
          equal([2, 3], values)
          done()
        } catch (error) {
          done(error)
        }
      })

      pipe(
        sut,
        provideHookEnv,
        provideEmptyHookStates,
        provideUuidEnv,
        provide<TimerEnv>({ timer }),
        runAsFiberWith(scheduler),
      )

      timer.progressTimeBy(0)
    }),
  ]),
])
