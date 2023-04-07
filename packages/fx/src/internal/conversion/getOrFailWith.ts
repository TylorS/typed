import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { fromEffect } from '@typed/fx/internal/conversion/fromEffect'
import type { Option } from '@typed/fx/internal/externals'
import { Effect } from '@typed/fx/internal/externals'

export const getOrFailWith: {
  <A, E>(option: Option.Option<A>, f: () => E): Fx<never, E, A>
  <E>(f: () => E): <A>(option: Option.Option<A>) => Fx<never, E, A>
} = dualWithTrace(
  2,
  (trace) =>
    <A, E>(option: Option.Option<A>, f: () => E): Fx<never, E, A> =>
      fromEffect(Effect.getOrFailWith(option, f).traced(trace)),
)
