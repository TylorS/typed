import { RuntimeOptions } from '@/Fiber/Runtime'

import { fork, join } from './Effect'
import { Fx } from './Fx'

export const forkJoin = <R, E, A>(fx: Fx<R, E, A>, runtimeOptions?: RuntimeOptions<E>) =>
  Fx(function* () {
    const fiber = yield* fork(fx, runtimeOptions)

    return yield* join(fiber)
  })
