import type * as A from '@fp-ts/core/typeclass/Alternative'

import { CoproductRace, CoproductOrElse } from './Coproduct.js'
import { SemiAlternativeRace, SemiAlternativeOrElse } from './SemiAlternative.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const ApplicativeRace: A.Alternative<FxTypeLambda> = {
  ...SemiAlternativeRace,
  ...CoproductRace,
}

export const ApplicativeOrElse: A.Alternative<FxTypeLambda> = {
  ...SemiAlternativeOrElse,
  ...CoproductOrElse,
}
