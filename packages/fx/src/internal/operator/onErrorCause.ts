import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'
import type { Cause } from '@typed/fx/internal/_externals'
import { onDoneCause } from '@typed/fx/internal/operator/onDoneCause'

export const onErrorCause: {
  <R, E, A, R2, E2, B>(
    self: Fx<R, E, A>,
    onFailure: (error: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  ): Fx<R | R2, E | E2, A>

  <E, R2, E2, B>(onFailure: (error: Cause.Cause<E>) => Effect.Effect<R2, E2, B>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      self: Fx<R, E, A>,
      onFailure: (error: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E | E2, A> =>
      onDoneCause(self, onFailure, () => Effect.unit()).traced(trace),
)
