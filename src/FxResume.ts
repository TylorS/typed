import * as FxT from './FxT'
import * as R from './Resume'

export const ap = FxT.ap({ ...R.MonadRec, ...R.Apply })
export const chain = FxT.chain<R.URI>()
export const doResume = FxT.getDo<R.URI>()
export const liftResume = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toResume = FxT.toMonad<R.URI>(R.MonadRec)
