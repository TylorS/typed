import * as P from '@fp-ts/core/typeclass/Product'

import { combineAll } from '../operator/combine.js'

import { Of } from './Of.js'
import { SemiProduct } from './SemiProduct.js'
import { FxTypeLambda } from './TypeLambda.js'

export const Product: P.Product<FxTypeLambda> = {
  ...SemiProduct,
  ...Of,
  productAll: (iterable) => combineAll(...Array.from(iterable)),
}
