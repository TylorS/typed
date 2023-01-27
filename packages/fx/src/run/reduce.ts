import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'

import type { Fx } from '../Fx.js'

import { observeSync } from './observe.js'

export const reduce: <B, A>(
  seed: B,
  f: (acc: B, a: A) => B,
) => <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B> = (seed, f) => (fx) =>
  Effect.suspendSucceed(() => {
    let acc = seed

    return pipe(
      fx,
      observeSync((a) => (acc = f(acc, a))),
      Effect.map(() => acc),
    )
  })
