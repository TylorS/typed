import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Effect, Either, pipe } from '@typed/fx/internal/externals'
import { onDoneCause } from '@typed/fx/internal/operator/onDoneCause'

export const onDone: {
  <R, E, A, R2, E2, B, R3, E3, C>(
    self: Fx<R, E, A>,
    onFailure: (error: E) => Effect.Effect<R2, E2, B>,
    onSuccess: (value: unknown) => Effect.Effect<R3, E3, C>,
  ): Fx<R | R2 | R3, E | E2 | E3, A>

  <E, R2, E2, B, R3, E3, C>(
    onFailure: (error: E) => Effect.Effect<R2, E2, B>,
    onSuccess: (value: unknown) => Effect.Effect<R3, E3, C>,
  ): <R, A>(self: Fx<R, E, A>) => Fx<R | R2 | R3, E | E2 | E3, A>
} = dualWithTrace(
  3,
  (trace) =>
    <R, E, A, R2, E2, B, R3, E3, C>(
      self: Fx<R, E, A>,
      onFailure: (error: E) => Effect.Effect<R2, E2, B>,
      onSuccess: (value: unknown) => Effect.Effect<R3, E3, C>,
    ) =>
      onDoneCause(
        self,
        (cause): Effect.Effect<R2, E2, B> =>
          pipe(cause, Cause.failureOrCause, Either.match(onFailure, Effect.failCause)),
        onSuccess,
      ).traced(trace),
)
