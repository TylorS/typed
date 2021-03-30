import * as E from 'fp-ts/IO'
import * as FxT from './FxT'

export const ap = FxT.ap({ ...E.Monad, ...E.ChainRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const doIO = FxT.getDo<E.URI>()
export const liftIO = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toIO = FxT.toMonad<E.URI>({ ...E.Monad, ...E.ChainRec })
