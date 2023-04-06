import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type { Cause } from '@effect/io/Cause'

import type { Fx } from '@typed/fx/internal/Fx'
import { failCause } from '@typed/fx/internal/constructor/failCause'
import { catchAllCause } from '@typed/fx/internal/error/catchAllCause'

export const catchSomeCause: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (cause: Cause<E>) => Option.Option<Fx<R2, E2, B>>): Fx<
    R | R2,
    E | E2,
    A | B
  >

  <E, R2, E2, B>(f: (cause: Cause<E>) => Option.Option<Fx<R2, E2, B>>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (cause: Cause<E>) => Option.Option<Fx<R2, E2, B>>) =>
      catchAllCause(self, (cause) =>
        pipe(
          cause,
          f,
          Option.getOrElse((): Fx<R2, E | E2, B> => failCause(cause)),
        ),
      ).traced(trace),
)
