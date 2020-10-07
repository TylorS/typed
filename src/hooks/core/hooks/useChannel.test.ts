import { Pure } from '@typed/fp/Effect/Effect'
import { doEffect, execPure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import { provideUuidEnv } from '@typed/fp/Uuid/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { provideHookEnv } from '../providers/provideHookEnv'
import { provideEmptyHookStates } from '../providers/provideHookStates'
import { createChannel } from '../types/Channel'
import { useChannel } from './useChannel'

export const test = describe(`useChannel`, [
  given(`a Channel<E, A>`, [
    it(`retrieves the current value of a channel`, ({ same }, done) => {
      const initial = Symbol()
      const channel = createChannel('test', Pure.of(initial))

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
        provideHookEnv,
        provideEmptyHookStates,
        provideSchedulerEnv,
        provideUuidEnv,
        execPure,
      )
    }),
  ]),
])
