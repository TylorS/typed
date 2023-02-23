import type * as P from '@effect/data/typeclass/Product'

import { combineAll } from '../operator/combine.js'

import { Of } from './Of.js'
import { SemiProduct } from './SemiProduct.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const Product: P.Product<FxTypeLambda> = {
  ...SemiProduct,
  ...Of,
  productAll: ((iterable) =>
    combineAll(...Array.from(iterable))) as P.Product<FxTypeLambda>['productAll'],
}
