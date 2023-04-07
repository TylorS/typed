import { dualWithTrace } from '@effect/data/Debug'
import type { Layer } from '@effect/io/Layer'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const provideLayer: {
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer<R2, E2, R>): Fx<R2, E | E2, A>
  <R2, E2, R>(layer: Layer<R2, E2, R>): <E, A>(fx: Fx<R, E, A>) => Fx<R2, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2>(fx: Fx<R, E, A>, layer: Layer<R2, E2, R>): Fx<R2, E | E2, A> =>
      fx.transform(Effect.provideSomeLayer(layer)).traced(trace),
)
