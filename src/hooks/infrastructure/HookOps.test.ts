import { newDefaultScheduler } from '@most/scheduler'
import { isBrowser } from '@typed/fp/common/exports'
import { doEffect, execEffect, Pure } from '@typed/fp/Effect/exports'
import { createBrowserUuidEnv, createNodeUuidEnv } from '@typed/fp/Uuid/exports'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/es6/pipeable'

import { createHookRequirements, runWithHooks, useState } from '../domain/exports'
import { provideHookOps } from './provideHookOps'
import { provideHooksManagerEnv } from './provideHooksManagerEnv'

export const test = describe(`HookOps`, [
  describe(`useState`, [
    it(`allows keeping state between calls`, ({ equal }, done) => {
      const initial = 1
      const f = (n: number) => n + 1
      const useNumState = useState(Pure.of(initial))

      const sut = doEffect(function* () {
        const requirements = yield* createHookRequirements
        const [getA, updateA] = yield* runWithHooks(useNumState, requirements)

        try {
          equal(initial, yield* getA)
          equal(f(initial), yield* updateA(f))

          const [getB] = yield* runWithHooks(useNumState, requirements)

          equal(f(initial), yield* getB)

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
