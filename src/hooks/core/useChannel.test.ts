import { newDefaultScheduler } from '@most/scheduler'
import { isBrowser } from '@typed/fp/common/exports'
import { Pure } from '@typed/fp/Effect/Effect'
import { doEffect, execPure, provide } from '@typed/fp/Effect/exports'
import { createBrowserUuidEnv, createNodeUuidEnv, uuid4 } from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { createChannel } from './Channel'
import { createHookEnvironment, HookEnvironmentId } from './HookEnvironment'
import { provideEmptyHookStates } from './provideHookStates'
import { useChannel } from './useChannel'

export const test = describe(`useChannel`, [
  given(`a Channel<E, A>`, [
    it(`retrieves the current value of a channel`, ({ same }, done) => {
      const initial = Symbol()
      const channel = createChannel('test', Pure.of(initial))
      const hookEnvironment = createHookEnvironment(createId())

      const sut = doEffect(function* () {
        const actual = yield* useChannel(channel)

        try {
          same(initial, actual)
          done()
        } catch (err) {
          done(err)
        }
      })

      pipe(
        sut,
        provideEmptyHookStates,
        provide({ hookEnvironment, scheduler: newDefaultScheduler() }),
        execPure,
      )
    }),
  ]),
])

function createId() {
  const { randomUuidSeed } = isBrowser ? createBrowserUuidEnv() : createNodeUuidEnv()

  return pipe(randomUuidSeed(), uuid4, HookEnvironmentId.wrap)
}
