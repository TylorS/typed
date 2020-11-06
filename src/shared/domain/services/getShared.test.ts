import { doEffect, execPure, Pure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import { describe, given, it } from '@typed/test'
import { pipe } from 'fp-ts/function'

import { provideSharedEnv } from '../../infrastructure/provideSharedEnv'
import { shared } from '../constructors/exports'
import { getShared } from './getShared'

export const test = describe(`getShared`, [
  given(`a Shared instance`, [
    it(`returns the default value`, ({ same }, done) => {
      const expected = {}
      const initial = Pure.of(expected)
      const state = shared('test', initial)

      const sut = doEffect(function* () {
        try {
          const actual = yield* getShared(state)

          same(expected, actual)

          done()
        } catch (error) {
          done(error)
        }
      })

      pipe(sut, provideSharedEnv, provideSchedulerEnv, execPure)
    }),
  ]),
])
