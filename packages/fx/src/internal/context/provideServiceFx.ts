import type { Tag } from '@effect/data/Context'
import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect, pipe } from '@typed/fx/internal/_externals'
import { switchMap } from '@typed/fx/internal/operator/switchMap'

export const provideServiceFx: {
  <R, I, E, A, S, R2, E2>(
    fx: Fx<R | I, E, A>,
    service: Tag<I, S>,
    implementation: Fx<R2, E2, S>,
  ): Fx<R2 | Exclude<R, I>, E | E2, A>
  <I, S, R2, E2>(service: Tag<I, S>, implementation: Fx<R2, E2, S>): <R, E, A>(
    fx: Fx<R | S, E, A>,
  ) => Fx<R2 | Exclude<R, S>, E | E2, A>
} = dualWithTrace(
  3,
  (trace) =>
    <R, I, E, A, S, R2, E2>(
      fx: Fx<R | I, E, A>,
      service: Tag<I, S>,
      implementation: Fx<R2, E2, S>,
    ): Fx<R2 | Exclude<R, I>, E | E2, A> =>
      pipe(
        implementation,
        switchMap((s) => fx.transform(Effect.provideService(service, s))),
      ).traced(trace),
)
