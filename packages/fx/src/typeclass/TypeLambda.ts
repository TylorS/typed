import type { TypeLambda } from '@effect/data/HKT'

import type { Fx } from '../Fx.js'

export interface FxTypeLambda extends TypeLambda {
  readonly type: Fx<this['Out2'], this['Out1'], this['Target']>
}
