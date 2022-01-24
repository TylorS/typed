import { fork, join } from './Effect'
import { Fx } from './Fx'

export const forkJoin = <R, E, A>(fx: Fx<R, E, A>) =>
  Fx(function* () {
    const fiber = yield* fork(fx)

    return yield* join(fiber)
  })
