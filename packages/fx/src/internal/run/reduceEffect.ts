import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const reduceEffect: {
  <R, E, A, B, R2, E2>(
    fx: Fx<R, E, A>,
    seed: B,
    f: (acc: B, a: A) => Effect.Effect<R2, E2, B>,
  ): Effect.Effect<R | R2, E | E2, B>
  <B, A, R2, E2>(seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Effect.Effect<R | R2, E | E2, B>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, B, R2, E2>(fx: Fx<R, E, A>, seed: B, f: (acc: B, a: A) => Effect.Effect<R2, E2, B>) =>
      Effect.gen(function* ($) {
        const lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
        let acc = seed

        yield* $(
          fx.observe((a) => lock(Effect.tap(f(acc, a), (b) => Effect.sync(() => (acc = b))))),
        )

        return acc
      }).traced(trace),
)
