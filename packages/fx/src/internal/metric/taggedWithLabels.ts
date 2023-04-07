import { dualWithTrace } from '@effect/data/Debug'
import type * as MetricLabel from '@effect/io/Metric/Label'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const taggedWithLabels: {
  (labels: Iterable<MetricLabel.MetricLabel>): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(self: Fx<R, E, A>, labels: Iterable<MetricLabel.MetricLabel>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, labels: Iterable<MetricLabel.MetricLabel>) =>
      self.transform(Effect.taggedWithLabels(labels)).traced(trace),
)
