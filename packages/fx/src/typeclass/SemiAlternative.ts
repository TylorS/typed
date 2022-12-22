import * as SA from '@fp-ts/core/typeclass/SemiAlternative'

import { Covariant } from './Covariant.js'
import { SemiCoproductRace, SemiCoproductOrElse } from './SemiCoproduct.js'
import { FxTypeLambda } from './TypeLambda.js'

export const SemiAlternativeRace: SA.SemiAlternative<FxTypeLambda> = {
  ...SemiCoproductRace,
  ...Covariant,
}

export const SemiAlternativeOrElse: SA.SemiAlternative<FxTypeLambda> = {
  ...SemiCoproductOrElse,
  ...Covariant,
}