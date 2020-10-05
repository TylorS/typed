import { undisposable } from '@typed/fp/Disposable/exports'
import { doEffect, execPure, Pure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import { provideUuidEnv } from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { createChannel } from './Channel'
import { isUpdatedHookEnvironmentEvent } from './events'
import { createChildHookEnvironment } from './HookEnvironment'
import { listenToHookEvents } from './HookEvents'
import { provideChannel } from './provideChannel'
import { provideHookEnv } from './provideHookEnvironment'
import { provideEmptyHookStates } from './provideHookStates'
import { runWithHooks } from './runWithHooks'
import { updateState } from './State'
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

        const env = yield* createChildHookEnvironment

        yield* runWithHooks(env, child)
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

        const env = yield* createChildHookEnvironment

        yield* listenToHookEvents(
          isUpdatedHookEnvironmentEvent,
          undisposable((event) => {
            try {
              equal(env.id, event.hookEnvironment.id)
              done()
            } catch (error) {
              done(error)
            }
          }),
        )

        yield* runWithHooks(env, child)
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
