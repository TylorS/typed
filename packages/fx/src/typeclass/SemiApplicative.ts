import type * as SA from '@effect/data/typeclass/SemiApplicative'

import { Covariant } from './Covariant.js'
import { SemiProduct } from './SemiProduct.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const SemiApplicative: SA.SemiApplicative<FxTypeLambda> = {
  ...SemiProduct,
  ...Covariant,
}
