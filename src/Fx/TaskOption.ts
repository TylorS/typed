import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { flow } from 'fp-ts/function'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import { Pointed1 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import * as R from '../TaskOption'
import { Fx } from './Fx'

export const of = FxT.of(R.Pointed)
export const ap = FxT.ap({ ...R.MonadRec, ...R.ApplyPar })
export const apSeq = FxT.ap({ ...R.MonadRec, ...R.ApplySeq })
export const chain = FxT.chain<R.URI>()
export const chainRec = FxT.chainRec<R.URI>(R.MonadRec)
export const doTaskOption = FxT.getDo<R.URI>()
export const liftTaskOption = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toTaskOption = FxT.toMonad<R.URI>(R.MonadRec)
export const Do = flow(doTaskOption, toTaskOption)

export const URI = '@typed/fp/Fx/TaskOption'
export type URI = typeof URI

export interface FxTaskOption<A> extends Fx<R.TaskOption<unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: FxTaskOption<A>
  }
}

export const Pointed: Pointed1<URI> = {
  of,
}

export const Functor: Functor1<URI> = {
  map,
}

export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain1<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec1<URI> = {
  chainRec,
}
