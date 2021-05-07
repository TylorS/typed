import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { FromState2 } from 'fp-ts/FromState'
import { flow } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import * as S from '../State'
import { Fx } from './Fx'

export const of = FxT.of(S.Pointed)
export const ap = FxT.ap({ ...S.MonadRec, ...S.Apply })
export const chain = FxT.chain<S.URI>()
export const chainRec = FxT.chainRec<S.URI>(S.MonadRec)
export const doState = FxT.getDo<S.URI>()
export const liftState = FxT.liftFx<S.URI>()
export const map = FxT.map<S.URI>()
export const toState = FxT.toMonad<S.URI>(S.MonadRec)
export const Do = flow(doState, toState)

export const URI = '@typed/fp/Fx/State'
export type URI = typeof URI

export interface FxState<E, A> extends Fx<S.State<E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxState<E, A>
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

export const FromState: FromState2<URI> = {
  fromState: liftState,
}
