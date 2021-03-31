import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as E from './EnvOption'
import { Fx } from './Fx'
import * as FxT from './FxT'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doEnvOption = FxT.getDo<E.URI>()
export const liftEnvOption = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnvOption = FxT.toMonad<E.URI>(E.MonadRec)
export const ask = FxT.ask(E.FromReader)
export const asks = FxT.asks(E.FromReader)

export const URI = '@typed/fp/Fx/EnvOption'
export type URI = typeof URI

export interface FxEither<E, A> extends Fx<E.EnvOption<E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxEither<E, A>
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
