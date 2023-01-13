import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import type { Fx } from '../Fx.js'
import { take } from '../operator/take.js'

import { reduce } from './reduce.js'

export const collectN =
  (amount: number) =>
  <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, readonly A[]> =>
    Effect.suspendSucceed(() =>
      pipe(
        fx,
        take(amount),
        reduce([] as A[], (acc, a) => {
          acc.push(a)
          return acc
        }),
      ),
    )
