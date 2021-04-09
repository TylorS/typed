import { doEnv, toEnv } from '@fp/Fx/Env'
import { none } from '@fp/Option'
import { zip } from '@fp/Resume'

import { Fiber } from '../../Fiber'
import { FiberFinalizers } from '../FiberFinalizers'

export const finalize = <A>(fiber: Fiber<A>) => {
  const fx = doEnv(function* (_) {
    // Check for any registered finalizers which should run before changing status to aborted
    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers))

    if (finalizers.length > 0) {
      yield* _(() => zip(finalizers.map((f) => f(none))))
    }
  })

  return toEnv(fx)
}
