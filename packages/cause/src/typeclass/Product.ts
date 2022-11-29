import * as P from '@fp-ts/core/typeclass/Product'
import { isNonEmpty } from 'node_modules/@fp-ts/data/ReadonlyArray.js'

import { Cause, Empty } from '../Cause.js'

import { Of } from './Of.js'
import { SemiProduct, nonEmptyTuple } from './SemiProduct.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const Product: P.Product<CauseTypeLambda> = {
  ...SemiProduct,
  ...Of,
  productAll: <A>(causes: Iterable<Cause<A>>) => {
    const array = Array.from(causes)

    if (isNonEmpty(array)) {
      const [first, ...rest] = array
      return nonEmptyTuple(first, ...rest)
    }

    return Empty
  },
}
