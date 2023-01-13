import type * as P from '@fp-ts/core/typeclass/Pointed'

import { Covariant } from './Covariant.js'
import { Of } from './Of.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const Pointed: P.Pointed<FxTypeLambda> = {
  ...Of,
  ...Covariant,
}
