import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'

export const reduce: {
  <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B): Effect.Effect<R, E, B>
  <B, A>(seed: B, f: (acc: B, a: A) => B): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, B>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, B>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => B) =>
      Effect.gen(function* ($) {
        let acc = seed

        yield* $(fx.observe((a) => Effect.sync(() => (acc = f(acc, a)))))

        return acc
      }).traced(trace),
)
