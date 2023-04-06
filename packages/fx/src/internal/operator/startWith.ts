import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { succeed } from '@typed/fx/internal/constructor/succeed'
import { continueWith } from '@typed/fx/internal/operator/continueWith'

export const startWith: {
  <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B>
  <B>(value: B): <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, A | B> =>
      continueWith(succeed(value), () => fx).traced(trace),
)
