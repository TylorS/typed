import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Cause } from '@typed/fx/internal/_externals'
import { mapCause } from '@typed/fx/internal/operator/mapCause'

export const mapError: {
  <E, E2>(f: (e: E) => E2): <R, A>(self: Fx<R, E, A>) => Fx<R, E2, A>
  <R, E, A, E2>(self: Fx<R, E, A>, f: (e: E) => E2): Fx<R, E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, E2>(self: Fx<R, E, A>, f: (e: E) => E2) =>
      mapCause(self, Cause.map(f)).traced(trace),
)
