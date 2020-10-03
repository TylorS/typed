import { newDefaultScheduler } from '@most/scheduler'
import { isBrowser } from '@typed/fp/common/exports'
import { doEffect, execPure, provide, Pure } from '@typed/fp/Effect/exports'
import { createBrowserUuidEnv, createNodeUuidEnv, uuid4 } from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { createChannel } from './Channel'
import {
  createChildHookEnvironment,
  createHookEnvironment,
  HookEnvironmentId,
} from './HookEnvironment'
import { provideChannel } from './provideChannel'
import { provideEmptyHookStates } from './provideHookStates'
import { runWithHooks } from './runWithHooks'
import { updateState } from './State'
import { useChannel } from './useChannel'

export const test = describe(`provideChannel`, [
  given(`a Channel and an Eq`, [
    it(`provides values`, ({ equal }, done) => {
      const initial = 1
      const channel = createChannel('test', Pure.of(initial))
      const hookEnvironment = createHookEnvironment(createId())

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
        provideEmptyHookStates,
        provide({ hookEnvironment, randomUuidSeed, scheduler: newDefaultScheduler() }),
        execPure,
      )
    }),
  ]),
])

function createId() {
  return pipe(randomUuidSeed(), uuid4, HookEnvironmentId.wrap)
}

function randomUuidSeed() {
  const { randomUuidSeed } = isBrowser ? createBrowserUuidEnv() : createNodeUuidEnv()

  return randomUuidSeed()
}
