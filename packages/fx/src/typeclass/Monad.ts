import * as M from '@fp-ts/core/typeclass/Monad'

import { Covariant } from './Covariant.js'
import { FlatMap, SwitchMap, ExhaustMap } from './FlatMap.js'
import { Pointed } from './Pointed.js'
import { FxTypeLambda } from './TypeLambda.js'

export const Monad: M.Monad<FxTypeLambda> = {
  ...FlatMap,
  ...Covariant,
  ...Pointed,
}

export const MonadSwitch: M.Monad<FxTypeLambda> = {
  ...SwitchMap,
  ...Covariant,
  ...Pointed,
}

export const MonadExhaust: M.Monad<FxTypeLambda> = {
  ...ExhaustMap,
  ...Covariant,
  ...Pointed,
}
