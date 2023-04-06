import * as F from '@effect/data/typeclass/FlatMap'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { flatMap } from '@typed/fx/internal/operator/flatMap'

export const FlatMap: F.FlatMap<FxTypeLambda> = {
  flatMap,
}

export const zipRight: {
  <R2, E2, B>(that: Fx<R2, E2, B>): <R1, E1, _>(self: Fx<R1, E1, _>) => Fx<R2 | R1, E2 | E1, B>
  <R1, E1, A, R2, E2, B>(self: Fx<R1, E1, A>, that: Fx<R2, E2, B>): Fx<R1 | R2, E1 | E2, B>
} = F.zipRight(FlatMap)

export const composeK: {
  <B, R2, E2, C>(bfc: (b: B) => Fx<R2, E2, C>): <A, R1, E1>(
    afb: (a: A) => Fx<R1, E1, B>,
  ) => (a: A) => Fx<R2 | R1, E2 | E1, C>

  <A, R1, E1, B, R2, E2, C>(afb: (a: A) => Fx<R1, E1, B>, bfc: (b: B) => Fx<R2, E2, C>): (
    a: A,
  ) => Fx<R2 | R1, E2 | E1, C>
} = F.composeK(FlatMap)
