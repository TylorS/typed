import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const withParallelism: {
  <R, E, A>(self: Fx<R, E, A>, concurrency: number): Fx<R, E, A>
  (concurrency: number): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, concurrency: number) =>
      self.transform(Effect.withParallelism(concurrency)).traced(trace),
)
