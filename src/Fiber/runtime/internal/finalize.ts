import { doEnv, toEnv } from '@fp/Fx/Env'
import { none } from '@fp/Option'
import { zip } from '@fp/Resume'

import { Fiber } from '../../Fiber'
import { FiberFinalizers } from '../FiberFinalizers'
import { changeStatus } from './changeStatus'

export const finalize = <A>(fiber: Fiber<A>, aborting = false) => {
  const fx = doEnv(function* (_) {
    // Check for any registered finalizers which should run before changing status to aborted
    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers))

    if (finalizers.length > 0) {
      // Set the status to aborting if there are finalizers to run
      if (aborting) {
        yield* _(changeStatus({ type: 'aborting' }))
      }

      yield* _(() => zip(finalizers.map((f) => f(none))))
    }
  })

  return toEnv(fx)
}
