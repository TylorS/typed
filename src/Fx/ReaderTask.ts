import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { flow } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import * as R from '../ReaderTask'
import { Fx } from './Fx'

export const of = FxT.of(R.Pointed)
export const ap = FxT.ap({ ...R.MonadRec, ...R.ApplicativePar })
export const apSeq = FxT.ap({ ...R.MonadRec, ...R.ApplicativeSeq })
export const chain = FxT.chain<R.URI>()
export const chainRec = FxT.chainRec<R.URI>(R.MonadRec)
export const doReaderTask = FxT.getDo<R.URI>()
export const liftReaderTask = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toReaderTask = FxT.toMonad<R.URI>(R.MonadRec)
export const Do = flow(doReaderTask, toReaderTask)

export const URI = '@typed/fp/Fx/ReaderTask'
export type URI = typeof URI

export interface FxReaderTask<R, A> extends Fx<R.ReaderTask<R, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxReaderTask<E, A>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
  map,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}
