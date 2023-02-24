import type * as SA from '@effect/data/typeclass/SemiAlternative'

import { Covariant } from './Covariant.js'
import { SemiCoproductRace, SemiCoproductOrElse } from './SemiCoproduct.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const SemiAlternativeRace: SA.SemiAlternative<FxTypeLambda> = {
  ...SemiCoproductRace,
  ...Covariant,
}

export const SemiAlternativeOrElse: SA.SemiAlternative<FxTypeLambda> = {
  ...SemiCoproductOrElse,
  ...Covariant,
}
