import * as A from '@fp-ts/core/typeclass/Alternative'

import { ConcurrentCoproduct, SequentialCoproduct } from './Coproduct.js'
import { SemiApplicative } from './SemiApplicative.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const SequentialAlternative: A.Alternative<CauseTypeLambda> = {
  ...SemiApplicative,
  ...SequentialCoproduct,
}

export const ConcurrentAlternative: A.Alternative<CauseTypeLambda> = {
  ...SemiApplicative,
  ...ConcurrentCoproduct,
}
