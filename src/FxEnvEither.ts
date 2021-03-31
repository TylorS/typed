import { Applicative3 } from 'fp-ts/Applicative'
import { Apply3 } from 'fp-ts/Apply'
import { Chain3 } from 'fp-ts/Chain'
import { ChainRec3 } from 'fp-ts/ChainRec'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

import * as E from './EnvEither'
import { Fx } from './Fx'
import * as FxT from './FxT'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doEnvEither = FxT.getDo<E.URI>()
export const liftEnvEither = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnvEither = FxT.toMonad<E.URI>(E.MonadRec)
export const ask = FxT.ask(E.FromReader)
export const asks = FxT.asks(E.FromReader)

export const URI = '@typed/fp/Fx/EnvEither'
export type URI = typeof URI

export interface FxEnvEither<R, E, A> extends Fx<E.EnvEither<R, E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: FxEnvEither<R, E, A>
  }
}

export const Pointed: Pointed3<URI> = {
  of,
}

export const Functor: Functor3<URI> = {
  map,
}

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain3<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec3<URI> = {
  chainRec,
}
