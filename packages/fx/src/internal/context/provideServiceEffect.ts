import type { Tag } from '@effect/data/Context'
import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const provideServiceEffect: {
  <R, I, E, A, S, R2, E2>(
    fx: Fx<R | I, E, A>,
    service: Tag<I, S>,
    implementation: Effect.Effect<R2, E2, S>,
  ): Fx<R2 | Exclude<R, I>, E | E2, A>
  <I, S, R2, E2>(service: Tag<I, S>, implementation: Effect.Effect<R2, E2, S>): <R, E, A>(
    fx: Fx<R | I, E, A>,
  ) => Fx<R2 | Exclude<R, I>, E | E2, A>
} = dualWithTrace(
  3,
  (trace) =>
    <R, I, E, A, S, R2, E2>(
      fx: Fx<R | I, E, A>,
      service: Tag<I, S>,
      implementation: Effect.Effect<R2, E2, S>,
    ): Fx<R2 | Exclude<R, I>, E | E2, A> =>
      fx.transform(Effect.provideServiceEffect(service, implementation)).traced(trace),
)
