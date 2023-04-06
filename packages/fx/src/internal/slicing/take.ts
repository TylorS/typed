import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { slice } from '@typed/fx/internal/slicing/slice'

export const take: {
  <R, E, A>(self: Fx<R, E, A>, take: number): Fx<R, E, A>
  (take: number): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, take: number) =>
      slice(self, 0, take).traced(trace),
)
