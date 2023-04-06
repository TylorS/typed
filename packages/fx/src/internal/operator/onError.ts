import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import { onDone } from '@typed/fx/internal/operator/onDone'

export const onError: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, onFailure: (error: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A
  >

  <E, R2, E2, B>(onFailure: (error: E) => Effect.Effect<R2, E2, B>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      self: Fx<R, E, A>,
      onFailure: (error: E) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, A> =>
      onDone(self, onFailure, () => Effect.unit()).traced(trace),
)
