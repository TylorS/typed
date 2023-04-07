import { dualWithTrace } from '@effect/data/Debug'
import type * as HashSet from '@effect/data/HashSet'
import type * as MetricLabel from '@effect/io/Metric/Label'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const taggedWithLabelSet: {
  (labels: HashSet.HashSet<MetricLabel.MetricLabel>): <R, E, A>(self: Fx<R, E, A>) => Fx<R, E, A>
  <R, E, A>(self: Fx<R, E, A>, labels: HashSet.HashSet<MetricLabel.MetricLabel>): Fx<R, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A>(self: Fx<R, E, A>, labels: HashSet.HashSet<MetricLabel.MetricLabel>) =>
      self.transform(Effect.taggedWithLabelSet(labels)).traced(trace),
)
