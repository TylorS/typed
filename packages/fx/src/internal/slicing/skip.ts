import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { slice } from '@typed/fx/internal/slicing/slice'

export const skip: {
  <R, E, A>(self: Fx<R, E, A>, skip: number): Fx<R, E, A>
  (skip: number): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, skip: number) =>
      slice(self, skip, Infinity).traced(trace),
)
