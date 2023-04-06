import { dualWithTrace } from '@effect/data/Debug'
import * as Option from '@effect/data/Option'

import type { Fx } from '@typed/fx/internal/Fx'
import { fail } from '@typed/fx/internal/constructor/fail'
import { catchAll } from '@typed/fx/internal/error/catchAll'

export const catchSome: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (error: E) => Option.Option<Fx<R2, E2, B>>): Fx<
    R | R2,
    E | E2,
    A | B
  >

  <E, R2, E2, B>(f: (error: E) => Option.Option<Fx<R2, E2, B>>): <R, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (error: E) => Option.Option<Fx<R2, E2, B>>) =>
      catchAll(self, (error) =>
        Option.getOrElse(f(error), (): Fx<R2, E | E2, B> => fail(error)),
      ).traced(trace),
)
