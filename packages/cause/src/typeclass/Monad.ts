import { monad } from '@fp-ts/core'
import * as Gen from '@fp-ts/data/typeclass/Gen'

import { Chainable } from './Chainable.js'
import { Of } from './Of.js'
import { CauseTypeLambda } from './TypeLambda.js'

export const Monad: monad.Monad<CauseTypeLambda> = {
  ...Of,
  ...Chainable,
}

export const gen = Gen.singleShot<CauseTypeLambda>(Monad)(Gen.adapter<CauseTypeLambda>())
