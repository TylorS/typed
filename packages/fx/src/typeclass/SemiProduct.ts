import { dual } from '@fp-ts/core/Function'
import * as SP from '@fp-ts/core/typeclass/SemiProduct'

import type { Fx } from '../Fx.js'
import { combine } from '../operator/combine.js'

import { Covariant } from './Covariant.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const product: SP.SemiProduct<FxTypeLambda>['product'] = dual(
  2,
  <R, E, A, R2, E2, B>(self: Fx<R, E, A>, that: Fx<R2, E2, B>) => combine(that)(self),
)

export const productMany = SP.productMany<FxTypeLambda>(Covariant.map, product)

export const SemiProduct: SP.SemiProduct<FxTypeLambda> = {
  product,
  productMany,
  imap: Covariant.imap,
}
