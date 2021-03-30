import * as E from 'fp-ts/Either'
import * as FxT from './FxT'

export const ap = FxT.ap({ ...E.Monad, ...E.ChainRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const doEither = FxT.getDo<E.URI>()
export const liftEither = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEither = FxT.toMonad<E.URI>({ ...E.Monad, ...E.ChainRec })
