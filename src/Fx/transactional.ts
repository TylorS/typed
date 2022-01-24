import { isRight } from 'fp-ts/Either'

import { fork } from './Effect'
import { Fx } from './Fx'

export const transactional = <R, E, A>(fx: Fx<R, E, A>) =>
  Fx(function* () {
    const fiber = yield* fork(fx)
    const exit = yield* fiber.exit

    // Inherit refs only if successful
    if (isRight(exit)) {
      yield* fiber.inheritRefs
    }

    return exit
  })
