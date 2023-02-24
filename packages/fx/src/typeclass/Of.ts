import type * as O from '@effect/data/typeclass/Of'

import { succeed } from '../constructor/succeed.js'

import type { FxTypeLambda } from './TypeLambda.js'

export const Of: O.Of<FxTypeLambda> = {
  of: succeed,
}
