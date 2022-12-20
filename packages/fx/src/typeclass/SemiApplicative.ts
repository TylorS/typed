import * as SA from '@fp-ts/core/typeclass/SemiApplicative'

import { Covariant } from './Covariant.js'
import { SemiProduct } from './SemiProduct.js'
import { FxTypeLambda } from './TypeLambda.js'

export const SemiApplicative: SA.SemiApplicative<FxTypeLambda> = {
  ...SemiProduct,
  ...Covariant,
}
