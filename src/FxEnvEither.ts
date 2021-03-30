import * as E from './EnvEither'
import * as FxT from './FxT'

export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const doEnvEither = FxT.getDo<E.URI>()
export const liftEnvEither = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnvEither = FxT.toMonad<E.URI>(E.MonadRec)
