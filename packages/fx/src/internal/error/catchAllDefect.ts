import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { failCause } from '@typed/fx/internal/constructor/failCause'
import { catchAllCause } from '@typed/fx/internal/error/catchAllCause'
import { Cause, Chunk, Option, pipe } from '@typed/fx/internal/externals'

export const catchAllDefect: {
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, f: (defect: unknown) => Fx<R2, E2, B>): Fx<
    R | R2,
    E | E2,
    A | B
  >
  <R2, E2, B>(f: (defect: unknown) => Fx<R2, E2, B>): <R, E, A>(
    self: Fx<R, E, A>,
  ) => Fx<R | R2, E | E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      self: Fx<R, E, A>,
      f: (defect: unknown) => Fx<R2, E2, B>,
    ): Fx<R | R2, E | E2, A | B> =>
      catchAllCause(
        self,
        (cause): Fx<R2, E | E2, B> =>
          pipe(
            Cause.defects(cause),
            Chunk.head,
            Option.match(() => failCause(cause), f),
          ),
      ).traced(trace),
)
