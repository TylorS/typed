import { Exit } from '@/Exit'
import { isRight } from '@/Prelude/Either'

import { fork } from './Effect'
import { Fx } from './Fx'

/**
 * Runs an Fx in an forked Context to allow FiberRefs to be adjusted in isolated
 * and if successful, merges them back into the parent Context.
 */
export const transactional = <R, E, A>(fx: Fx<R, E, A>): Fx<R, never, Exit<E, A>> =>
  Fx(function* () {
    const fiber = yield* fork(fx)
    const exit = yield* fiber.exit

    // Inherit refs only if successful
    if (isRight(exit)) {
      yield* fiber.inheritRefs
    }

    return exit
  })
