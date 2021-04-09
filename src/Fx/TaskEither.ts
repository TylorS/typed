import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import * as E from '../TaskEither'
import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.ApplyPar })
export const apSeq = FxT.ap({ ...E.MonadRec, ...E.ApplySeq })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doTaskEither = FxT.getDo<E.URI>()
export const liftTaskEither = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toTaskEither = FxT.toMonad<E.URI>(E.MonadRec)

export const URI = '@typed/fp/Fx/TaskEither'
export type URI = typeof URI

export interface FxEither<E, A> extends Fx<E.TaskEither<E, unknown>, A> {}

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
