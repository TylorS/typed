import { MonadRec } from '@fp/Task'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import { Pointed1 } from 'fp-ts/Pointed'
import * as T from 'fp-ts/Task'

import * as FxT from '../FxT'
import { Fx } from './Fx'

export const of = FxT.of(T.Pointed)
export const ap = FxT.ap({ ...MonadRec, ...T.ApplyPar })
export const apSeq = FxT.ap({ ...MonadRec, ...T.ApplicativeSeq })
export const chain = FxT.chain<T.URI>()
export const chainRec = FxT.chainRec(MonadRec)
export const doTask = FxT.getDo<T.URI>()
export const liftTask = FxT.liftFx<T.URI>()
export const map = FxT.map<T.URI>()
export const toTask = FxT.toMonad<T.URI>(MonadRec)

export const URI = '@typed/fp/Fx/Task'
export type URI = typeof URI

export interface FxTask<A> extends Fx<T.Task<unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: FxTask<A>
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
