import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Either } from '@typed/fx/internal/externals'
import { map } from '@typed/fx/internal/operator/map'

export const mapEither: {
  <A, B>(f: (a: A) => B): <R, E, E2>(
    self: Fx<R, E, Either.Either<E2, A>>,
  ) => Fx<R, E, Either.Either<E2, B>>
  <R, E, E2, A, B>(self: Fx<R, E, Either.Either<E2, A>>, f: (a: A) => B): Fx<
    R,
    E,
    Either.Either<E2, B>
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, E2, A, B>(self: Fx<R, E, Either.Either<E2, A>>, f: (a: A) => B) =>
      map(self, Either.map(f)).traced(trace),
)
