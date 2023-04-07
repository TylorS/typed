import type { Tag } from '@effect/data/Context'
import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Effect } from '@typed/fx/internal/externals'

export const updateService: {
  <R, I, E, A, S>(fx: Fx<R | I, E, A>, service: Tag<I, S>, f: (service: S) => S): Fx<R | I, E, A>
  <I, S>(service: Tag<I, S>, f: (service: S) => S): <R, E, A>(
    fx: Fx<R | I, E, A>,
  ) => Fx<R | I, E, A>
} = dualWithTrace(
  3,
  (trace) =>
    <R, I, E, A, S>(
      fx: Fx<R | I, E, A>,
      service: Tag<I, S>,
      f: (service: S) => S,
    ): Fx<R | I, E, A> =>
      fx.transform(Effect.updateService(service, f)).traced(trace),
)
