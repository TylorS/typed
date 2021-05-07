import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { flow } from 'fp-ts/function'
import { Functor1 } from 'fp-ts/Functor'
import * as E from 'fp-ts/IO'
import { Monad1 } from 'fp-ts/Monad'
import { Pointed1 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.Monad, ...E.ChainRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec({ ...E.Monad, ...E.ChainRec })
export const doIO = FxT.getDo<E.URI>()
export const liftIO = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toIO = FxT.toMonad<E.URI>({ ...E.Monad, ...E.ChainRec })
export const Do = flow(doIO, toIO)

export const URI = '@typed/fp/Fx/IO'
export type URI = typeof URI

export interface FxIO<A> extends Fx<E.IO<unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: FxIO<A>
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
