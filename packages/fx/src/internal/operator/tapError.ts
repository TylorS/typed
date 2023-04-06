import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'

import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Effect, Either } from '@typed/fx/internal/_externals'
import { tapCause } from '@typed/fx/internal/operator/tapCause'

export const tapError: {
  <E, R2, E2, B>(f: (error: E) => Effect.Effect<R2, E2, B>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A>

  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (error: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (error: E) => Effect.Effect<R2, E2, B>) =>
      tapCause(
        self,
        (cause): Effect.Effect<R2, E | E2, B> =>
          pipe(
            cause,
            Cause.failureOrCause,
            Either.match(f, () => Effect.failCause(cause)),
          ),
      ).traced(trace),
)
