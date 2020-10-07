import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect, execPure, Pure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import { provideUuidEnv } from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { provideHookEnv } from '../providers/provideHookEnv'
import { provideEmptyHookStates } from '../providers/provideHookStates'
import { listenToHookEvents } from '../sharedRefs/exports'
import { createChannel } from '../types/Channel'
import { isUpdatedHookEnvironmentEvent } from '../types/events'
import { createHookEnv } from '../types/HookEnvironment'
import { updateState } from '../types/State'
import { provideChannel } from './provideChannel'
import { runWithHooks } from './runWithHooks'
import { useChannel } from './useChannel'

export const test = describe(`provideChannel`, [
  given(`a Channel and an Eq`, [
    it(`provides values`, ({ equal }, done) => {
      const initial = 1
      const channel = createChannel('test', Pure.of(initial))

      const child = doEffect(function* () {
        const actual = yield* useChannel(channel)

        try {
          equal(initial + 1, actual)
          done()
        } catch (e) {
          done(e)
        }
      })

      const sut = doEffect(function* () {
        const testState = yield* provideChannel(channel)

        yield* updateState((x) => x + 1, testState)

        const env = yield* createHookEnv

        yield* runWithHooks(env.hookEnvironment, child)
      })

      pipe(
        sut,
        provideHookEnv,
        provideEmptyHookStates,
        provideUuidEnv,
        provideSchedulerEnv,
        execPure,
      )
    }),

    it(`updates all child consumers`, ({ equal }, done) => {
      const initial = 1
      const channel = createChannel('test', Pure.of(initial))

      const child = doEffect(function* () {
        const actual = yield* useChannel(channel)

        try {
          equal(initial + 1, actual)
          done()
        } catch (e) {
          done(e)
        }
      })

      const sut = doEffect(function* () {
        const testState = yield* provideChannel(channel)

        yield* updateState((x) => x + 1, testState)

        const env = yield* createHookEnv

        yield* listenToHookEvents(
          isUpdatedHookEnvironmentEvent,
          undisposable((event) => {
            try {
              equal(env.hookEnvironment.id, event.hookEnvironment.id)
              done()
            } catch (error) {
              done(error)
            }
          }),
        )

        yield* runWithHooks(env.hookEnvironment, child)
      })

      pipe(
        sut,
        provideHookEnv,
        provideEmptyHookStates,
        provideUuidEnv,
        provideSchedulerEnv,
        execPure,
      )
    }),
  ]),
])
