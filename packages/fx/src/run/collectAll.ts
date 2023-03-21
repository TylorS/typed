import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import type { Fx } from '../Fx.js'

import { reduce } from './reduce.js'

export const collectAll = <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, readonly A[]> =>
  Effect.suspend(() =>
    pipe(
      fx,
      reduce([] as A[], (acc, a) => {
        acc.push(a)
        return acc
      }),
    ),
  )
