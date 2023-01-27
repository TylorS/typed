import * as SP from '@fp-ts/core/typeclass/SemiProduct'

import { combine } from '../operator/combine.js'

import { Covariant } from './Covariant.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const SemiProduct: SP.SemiProduct<FxTypeLambda> = {
  product: ((s, o) => combine(o)(s)) as SP.SemiProduct<FxTypeLambda>['product'],
  productMany: SP.productMany<FxTypeLambda>(Covariant, (s, o) => combine(o)(s)),
  imap: Covariant.imap,
}
