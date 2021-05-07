import { flow } from 'cjs/function'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import { Pointed1 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import * as R from '../ResumeOption'
import { Fx } from './Fx'

export const of = FxT.of(R.Pointed)
export const ap = FxT.ap({ ...R.MonadRec, ...R.Apply })
export const chain = FxT.chain<R.URI>()
export const chainRec = FxT.chainRec<R.URI>(R.MonadRec)
export const doResumeOption = FxT.getDo<R.URI>()
export const liftResumeOption = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toResumeOption = FxT.toMonad<R.URI>(R.MonadRec)
export const Do = flow(doResumeOption, toResumeOption)

export const URI = '@typed/fp/Fx/ResumeOption'
export type URI = typeof URI

export interface FxResumeOption<A> extends Fx<R.ResumeOption<unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: FxResumeOption<A>
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
