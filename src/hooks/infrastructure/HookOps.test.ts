import { newDefaultScheduler } from '@most/scheduler'
import { isBrowser } from '@typed/fp/common'
import { doEffect, execEffect, Pure } from '@typed/fp/Effect'
import { createBrowserUuidEnv, createNodeUuidEnv } from '@typed/fp/Uuid'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/es6/pipeable'

import { useState } from '../useState'
import { provideHookOps } from './provideHookOps'
import { provideHooksManagerEnv } from './provideHooksManagerEnv'

export const test = describe(`HookOps`, [
  describe(`useState`, [
    it(`allows keeping state between calls`, ({ equal }, done) => {
      const initial = 1
      const f = (n: number) => n + 1
      const useNumState = useState(Pure.of(initial))

      const sut = doEffect(function* () {
        const [getX, updateX] = yield* useNumState

        try {
          equal(initial, yield* getX)
          equal(f(initial), yield* updateX(f))
          equal(f(initial), yield* getX)
          done()
        } catch (error) {
          done(error)
        }
      })

      pipe(
        sut,
        provideHookOps,
        provideHooksManagerEnv,
        execEffect({
          ...(isBrowser ? createBrowserUuidEnv() : createNodeUuidEnv()),
          scheduler: newDefaultScheduler(),
        }),
      )
    }),
  ]),
])
