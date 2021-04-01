import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import * as R from '../ResumeEither'
import { Fx } from './Fx'

export const of = FxT.of(R.Pointed)
export const ap = FxT.ap({ ...R.MonadRec, ...R.Apply })
export const chain = FxT.chain<R.URI>()
export const chainRec = FxT.chainRec<R.URI>(R.MonadRec)
export const doResumeEither = FxT.getDo<R.URI>()
export const liftResumeEither = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toResumeEither = FxT.toMonad<R.URI>(R.MonadRec)

export const URI = '@typed/fp/Fx/ResumeEither'
export type URI = typeof URI

export interface FxResumeEither<E, A> extends Fx<R.ResumeEither<E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxResumeEither<E, A>
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
