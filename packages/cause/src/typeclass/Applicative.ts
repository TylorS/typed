import { monoid } from '@fp-ts/core'
import * as A from '@fp-ts/core/typeclass/Applicative'

import { Cause } from '../Cause.js'

import { Product } from './Product.js'
import { SemiApplicative } from './SemiApplicative.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const Applicative: A.Applicative<CauseTypeLambda> = {
  ...SemiApplicative,
  ...Product,
}

export const liftMonoid: <A>(M: monoid.Monoid<A>) => monoid.Monoid<Cause<A>> =
  A.liftMonoid(Applicative)
