import { dualWithTrace } from '@effect/data/Debug'

import type { Fx } from '@typed/fx/internal/Fx'
import { Option } from '@typed/fx/internal/_externals'
import { map } from '@typed/fx/internal/operator/map'

export const mapSome: {
  <A, B>(f: (a: A) => B): <R, E>(self: Fx<R, E, Option.Option<A>>) => Fx<R, E, Option.Option<B>>
  <R, E, A, B>(self: Fx<R, E, Option.Option<A>>, f: (a: A) => B): Fx<R, E, Option.Option<B>>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, B>(self: Fx<R, E, Option.Option<A>>, f: (a: A) => B) =>
      map(self, Option.map(f)).traced(trace),
)
