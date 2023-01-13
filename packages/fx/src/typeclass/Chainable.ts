import type * as C from '@fp-ts/core/typeclass/Chainable'

import { Covariant } from './Covariant.js'
import { FlatMap, SwitchMap, ExhaustMap } from './FlatMap.js'
import type { FxTypeLambda } from './TypeLambda.js'

export const Chainable: C.Chainable<FxTypeLambda> = {
  ...FlatMap,
  ...Covariant,
}

export const Switchable: C.Chainable<FxTypeLambda> = {
  ...SwitchMap,
  ...Covariant,
}

export const Exhaustable: C.Chainable<FxTypeLambda> = {
  ...ExhaustMap,
  ...Covariant,
}
