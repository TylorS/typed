import * as C from '@effect/data/typeclass/Chainable'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { Covariant } from '@typed/fx/internal/typeclass/Covariant'
import { FlatMap } from '@typed/fx/internal/typeclass/FlatMap'

export const Chainable: C.Chainable<FxTypeLambda> = {
  ...Covariant,
  ...FlatMap,
}

export const zipLeft: {
  <R2, E2, _>(that: Fx<R2, E2, _>): <R1, E1, A>(self: Fx<R1, E1, A>) => Fx<R2 | R1, E2 | E1, A>

  <R1, E1, A, R2, E2, _>(self: Fx<R1, E1, A>, that: Fx<R2, E2, _>): Fx<R2 | R1, E2 | E1, A>
} = C.zipLeft(Chainable)
