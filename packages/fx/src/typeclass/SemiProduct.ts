import * as SP from '@fp-ts/core/typeclass/SemiProduct'

import { combine } from '../operator/combine.js'

import { Covariant } from './Covariant.js'
import { FxTypeLambda } from './TypeLambda.js'

export const SemiProduct: SP.SemiProduct<FxTypeLambda> = {
  product: combine,
  productMany: SP.productMany<FxTypeLambda>(Covariant, combine),
  imap: Covariant.imap,
}
