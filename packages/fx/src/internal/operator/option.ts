import { methodWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Option } from '@typed/fx/internal/_externals'
import { map } from '@typed/fx/internal/operator/map'

export const option: <R, E, A>(fx: Fx<R, E, A>) => Fx<R, E, Option.Option<A>> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, Option.Option<A>> =>
      map(fx, Option.some).traced(trace),
)
