import * as E from './Env'
import * as FxT from './FxT'

export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const doEnv = FxT.getDo<E.URI>()
export const liftEnv = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnv = FxT.toMonad<E.URI>(E.MonadRec)
