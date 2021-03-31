import * as FxT from './FxT'
import * as R from './ResumeOption'

export const ap = FxT.ap({ ...R.MonadRec, ...R.Apply })
export const chain = FxT.chain<R.URI>()
export const doResumeOption = FxT.getDo<R.URI>()
export const liftResumeOption = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toResumeOption = FxT.toMonad<R.URI>(R.MonadRec)
