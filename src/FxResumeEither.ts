import * as FxT from './FxT'
import * as R from './ResumeEither'

export const ap = FxT.ap({ ...R.MonadRec, ...R.Apply })
export const chain = FxT.chain<R.URI>()
export const doResumeEither = FxT.getDo<R.URI>()
export const liftResumeEither = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toResumeEither = FxT.toMonad<R.URI>(R.MonadRec)
