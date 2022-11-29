import * as SA from '@fp-ts/core/typeclass/SemiAlternative'

import { Covariant } from './Covariant.js'
import { ConcurrentSemiCoproduct, SequentialSemiCoproduct } from './SemiCoproduct.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const SequentialSemiAlternative: SA.SemiAlternative<CauseTypeLambda> = {
  ...SequentialSemiCoproduct,
  ...Covariant,
}

export const ConcurrentSemiAlternative: SA.SemiAlternative<CauseTypeLambda> = {
  ...ConcurrentSemiCoproduct,
  ...Covariant,
}
