import * as E from './EnvOption'
import * as FxT from './FxT'

export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const doEnvOption = FxT.getDo<E.URI>()
export const liftEnvOption = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnvOption = FxT.toMonad<E.URI>(E.MonadRec)
