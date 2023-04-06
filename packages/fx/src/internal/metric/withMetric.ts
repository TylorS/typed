import { dualWithTrace } from '@effect/data/Debug'
import type * as Metric from '@effect/io/Metric'

import { BaseFx } from '@typed/fx/internal/BaseFx'
import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'
import { Effect, pipe } from '@typed/fx/internal/_externals'

export const withMetric: {
  <Type, In, Out>(metric: Metric.Metric<Type, In, Out>): <R, E, A extends In>(
    self: Fx<R, E, A>,
  ) => Fx<R, E, A>
  <R, E, A extends In, Type, In, Out>(self: Fx<R, E, A>, metric: Metric.Metric<Type, In, Out>): Fx<
    R,
    E,
    A
  >
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A extends In, Type, In, Out>(self: Fx<R, E, A>, metric: Metric.Metric<Type, In, Out>) =>
      new WithMetricFx(self, metric).traced(trace),
)

class WithMetricFx<R, E, A extends In, Type, In, Out> extends BaseFx<R, E, A> {
  readonly name = 'WithMetric'

  constructor(readonly self: Fx<R, E, A>, readonly metric: Metric.Metric<Type, In, Out>) {
    super()
  }

  run(sink: Sink<E, A>) {
    return this.self.run(
      Sink((a) => pipe(sink.event(a), Effect.as(a), this.metric), sink.error, sink.end),
    )
  }
}
