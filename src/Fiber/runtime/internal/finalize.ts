import { useSome } from '@fp/Env'
import { doEnv, toEnv } from '@fp/Fx/Env'
import { none } from '@fp/Option'
import { zip } from '@fp/Resume'
import { pipe } from 'fp-ts/function'
import { isSome } from 'fp-ts/Option'

import { Fiber } from '../../Fiber'
import { removeChild } from '../FiberChildren'
import { FiberFinalizers } from '../FiberFinalizers'

export const finalize = <A>(fiber: Fiber<A>) => {
  const fx = doEnv(function* (_) {
    // Check for any registered finalizers which should run before changing status to aborted
    const finalizers = yield* _(fiber.refs.getRef(FiberFinalizers))

    if (finalizers.length > 0) {
      yield* _(() => zip(finalizers.map((f) => f(none))))
    }

    if (isSome(fiber.parent)) {
      // Clean up references to this child
      yield* pipe(removeChild(fiber), useSome({ currentFiber: fiber.parent.value }), _)
    }
  })

  return toEnv(fx)
}
