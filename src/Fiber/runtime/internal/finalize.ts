import { zip } from '@fp/Env'
import { doEnv, toEnv } from '@fp/Fx/Env'

import { Fiber } from '../../Fiber'
import { FiberFinalizers } from '../FiberFinalizers'
import { FiberReturnValue } from '../FiberReturnValue'
import { changeStatus } from './changeStatus'

/**
 * @internal
 */
export const finalize = <A>(fiber: Fiber<A>, aborting = false) => {
  const fx = doEnv(function* (_) {
    // Check for any registered finalizers which should run before changing status to aborted
    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers<A>()))

    if (finalizers.length > 0) {
      // Set the status to aborting if there are finalizers to run
      if (aborting) {
        yield* _(changeStatus({ type: 'aborting' }))
      }

      const returnValue = yield* _(fiber.refs.getRef(FiberReturnValue<A>()))

      yield* _(zip(finalizers.map((f) => f(returnValue))))
    }
  })

  return toEnv(fx)
}
