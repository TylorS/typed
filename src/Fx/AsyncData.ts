import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as E from '../AsyncData'
import * as FxT from '../FxT'
import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.Monad, ...E.ChainRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec<E.URI>({ ...E.Monad, ...E.ChainRec })
export const doAsyncData = FxT.getDo<E.URI>()
export const liftAsyncData = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toAsyncData = FxT.toMonad<E.URI>({ ...E.Monad, ...E.ChainRec })

export const URI = '@typed/fp/Fx/AsyncData'
export type URI = typeof URI

export interface FxAsyncData<E, A> extends Fx<E.AsyncData<E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxAsyncData<E, A>
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
