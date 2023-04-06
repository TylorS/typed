import * as A from '@effect/data/typeclass/Applicative'
import type { Monoid } from '@effect/data/typeclass/Monoid'

import type { Fx, FxTypeLambda } from '@typed/fx/internal/Fx'
import { Product } from '@typed/fx/internal/typeclass/Product'
import { SemiApplicative } from '@typed/fx/internal/typeclass/SemiApplicative'

export const Applicative: A.Applicative<FxTypeLambda> = {
  ...SemiApplicative,
  ...Product,
}

export const getMonoid: <R, E, A>(M: Monoid<A>) => Monoid<Fx<R, E, A>> = A.getMonoid(Applicative)
