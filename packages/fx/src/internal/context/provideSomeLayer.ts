import { dualWithTrace } from '@effect/data/Debug'
import type { Layer } from '@effect/io/Layer'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'

export const provideSomeLayer: {
  <R, S, E, A, R2, E2>(fx: Fx<R | S, E, A>, layer: Layer<R2, E2, S>): Fx<
    R2 | Exclude<R, S>,
    E | E2,
    A
  >
  <R2, E2, S>(layer: Layer<R2, E2, S>): <R, E, A>(
    fx: Fx<R | S, E, A>,
  ) => Fx<R2 | Exclude<R, S>, E | E2, A>
} = dualWithTrace(
  2,
  (trace) =>
    <R, S, E, A, R2, E2>(
      fx: Fx<R | S, E, A>,
      layer: Layer<R2, E2, S>,
    ): Fx<R2 | Exclude<R, S>, E | E2, A> =>
      fx.transform(Effect.provideSomeLayer(layer)).traced(trace),
)
