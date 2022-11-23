import { TypeLambda } from '@fp-ts/core/HKT'

import { Cause } from '../Cause.js'

export interface CauseTypeLambda extends TypeLambda {
  readonly type: Cause<this['Target']>
}
