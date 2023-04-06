import { methodWithTrace } from '@effect/data/Debug'
import type * as Effect from '@effect/io/Effect'

import type { Fx } from '@typed/fx/internal/Fx'
import { reduce } from '@typed/fx/internal/run/reduce'

export const toReadonlyArray: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, ReadonlyArray<A>> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, ReadonlyArray<A>> =>
        reduce(fx, [] as Array<A>, (xs, x) => {
          xs.push(x)
          return xs
        }).traced(trace),
  )

export const toArray = toReadonlyArray as <R, E, A>(
  fx: Fx<R, E, A>,
) => Effect.Effect<R, E, Array<A>>
