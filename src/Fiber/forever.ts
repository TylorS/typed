import { Env } from '@fp/Env'

import { DoF } from './DoF'
import { CloneOptions, fork, ForkOptions, join } from './Fiber'

export const forever = <E, A>(env: Env<E, A>, options?: ForkOptions & CloneOptions) =>
  DoF(function* (_) {
    let fiber = yield* _(fork(env, options))

    while (true) {
      yield* _(join(fiber))

      fiber = yield* _(() => fiber.clone(options))
    }
  })
