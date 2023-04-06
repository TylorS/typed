import type { Tag } from '@effect/data/Context'
import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/_externals'

export const provideService: {
  <R, I, E, A, S>(fx: Fx<R | I, E, A>, service: Tag<I, S>, implementation: S): Fx<
    Exclude<R, I>,
    E,
    A
  >
  <I, S>(service: Tag<I, S>, implementation: S): <R, E, A>(
    fx: Fx<R | S, E, A>,
  ) => Fx<Exclude<R, I>, E, A>
} = dualWithTrace(
  3,
  (trace) =>
    <R, I, E, A, S>(
      fx: Fx<R | I, E, A>,
      service: Tag<I, S>,
      implementation: S,
    ): Fx<Exclude<R, I>, E, A> =>
      fx.transform(Effect.provideService(service, implementation)).traced(trace),
)
