import * as O from '@fp-ts/core/typeclass/Of'

import { succeed } from '../constructor/succeed.js'

import { FxTypeLambda } from './TypeLambda.js'

export const Of: O.Of<FxTypeLambda> = {
  of: succeed,
}
