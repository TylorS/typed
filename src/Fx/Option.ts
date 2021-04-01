import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import { Pointed1 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import { MonadRec1 } from '../MonadRec'
import { Fx } from './Fx'

const chainRec_ = <A, B>(f: (value: A) => O.Option<E.Either<A, B>>) => (value: A): O.Option<B> => {
  let option = f(value)

  while (O.isSome(option)) {
    if (E.isRight(option.value)) {
      return O.some(option.value.right)
    }

    option = f(option.value.left)
  }

  return option
}

const ChainRec_: ChainRec1<O.URI> = {
  chainRec: chainRec_,
}

const MonadRec_: MonadRec1<O.URI> = {
  ...O.Monad,
  ...ChainRec_,
}

export const of = FxT.of(O.Pointed)
export const ap = FxT.ap({ ...MonadRec_, ...O.Apply })
export const chain = FxT.chain<O.URI>()
export const chainRec = FxT.chainRec(MonadRec_)
export const doOption = FxT.getDo<O.URI>()
export const liftOption = FxT.liftFx<O.URI>()
export const map = FxT.map<O.URI>()
export const toOption = FxT.toMonad<O.URI>(MonadRec_)

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
