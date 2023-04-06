import { dualWithTrace } from '@effect/data/Debug'
import { not } from '@effect/data/Predicate'

import type { Fx } from '@typed/fx/internal/Fx'
import { takeWhile } from '@typed/fx/internal/slicing/takeWhile'

export const takeUntil: {
  <R, E, A>(self: Fx<R, E, A>, predicate: (value: A) => boolean): Fx<R, E, A>
  <A>(predicate: (value: A) => boolean): <R, E>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, predicate: (value: A) => boolean) =>
      takeWhile(self, not(predicate)).traced(trace),
)
