import { MonadRec } from '@fp/Option'
import { flow } from 'cjs/function'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import { Fx } from './Fx'

export const of = FxT.of(O.Pointed)
export const ap = FxT.ap({ ...MonadRec, ...O.Apply })
export const chain = FxT.chain<O.URI>()
export const chainRec = FxT.chainRec(MonadRec)
export const doOption = FxT.getDo<O.URI>()
export const liftOption = FxT.liftFx<O.URI>()
export const map = FxT.map<O.URI>()
export const toOption = FxT.toMonad<O.URI>(MonadRec)
export const Do = flow(doOption, toOption)

export const URI = '@typed/fp/Fx/Option'
export type URI = typeof URI

export interface FxOption<A> extends Fx<O.Option<unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: FxOption<A>
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
