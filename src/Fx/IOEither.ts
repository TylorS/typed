import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import * as IOE from 'fp-ts/IOEither'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import { MonadRec } from '../IOEither'
import { Fx } from './Fx'

export const of = FxT.of(IOE.Pointed)
export const ap = FxT.ap({ ...MonadRec, ...IOE.ApplicativePar })
export const chain = FxT.chain<IOE.URI>()
export const chainRec = FxT.chainRec(MonadRec)
export const doEnv = FxT.getDo<IOE.URI>()
export const liftIOEither = FxT.liftFx<IOE.URI>()
export const map = FxT.map<IOE.URI>()
export const toIOEither = FxT.toMonad<IOE.URI>(MonadRec)

export const URI = '@typed/fp/Fx/IOEither'
export type URI = typeof URI

export interface FxIOEither<E, A> extends Fx<IOE.IOEither<E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxIOEither<E, A>
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
