import { doEffect, execPure } from '@typed/fp/Effect/exports'
import { provideSchedulerEnv } from '@typed/fp/fibers/exports'
import { sync } from '@typed/fp/Resume/Sync'
import { describe, it } from '@typed/test'
import { pipe } from 'fp-ts/lib/function'

import { Namespace, runWithNamespace, sendSharedEvent, usingNamespace } from '../core/exports'
import { createSharedEnvProvider, defaultHandlers } from '../createSharedEnvProvider/exports'
import { createRenderHandlers } from './handlers/exports'
import { Patch } from './Patch'
import { getRenderRef } from './RenderRef'

export const test = describe(`Patching`, [
  it(`patches namespace given a RenderRef`, ({ equal }, done) => {
    const namespaceB = Namespace.wrap('b')
    const initial = 0
    const value = 1

    const component = doEffect(function* () {
      const ref = yield* getRenderRef()

      if (!ref.current) {
        ref.current = initial
      }

      return value
    })

    const test = doEffect(function* () {
      try {
        equal(value, yield* runWithNamespace(namespaceB, component))

        yield* sendSharedEvent({ type: 'namespace/updated', namespace: namespaceB })

        let updated = yield* pipe(getRenderRef(), usingNamespace(namespaceB))

        equal(value, updated.current)

        yield* sendSharedEvent({ type: 'namespace/updated', namespace: namespaceB })

        updated = yield* pipe(getRenderRef(), usingNamespace(namespaceB))

        equal(value + 1, updated.current)

        done()
      } catch (error) {
        done(error)
      }
    })

    const patch: Patch<number, number> = {
      patch: (x, y) => sync(x + y),
    }

    pipe(
      test,
      createSharedEnvProvider({
        namespace: Namespace.wrap('a'),
        handlers: [...defaultHandlers, ...createRenderHandlers(patch)],
      }),
      provideSchedulerEnv,
      execPure,
    )
  }),
])
