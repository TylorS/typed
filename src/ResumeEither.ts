import { Alt2 } from 'fp-ts/Alt'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Bifunctor2 } from 'fp-ts/Bifunctor'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import { flow } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import { Semigroup } from 'fp-ts/Semigroup'

import { swapEithers } from './internal'
import { MonadRec2 } from './MonadRec'
import * as R from './Resume'

export type ResumeEither<E, A> = R.Resume<E.Either<E, A>>

export const alt = ET.alt(R.Monad)
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(R.Monad, semigroup)
export const ap = ET.ap(R.Apply)
export const bimap = ET.bimap(R.Functor)
export const bracket = ET.bracket(R.Monad)
export const chain = ET.chain(R.Monad)
export const getOrElse = ET.getOrElse(R.Monad)
export const getOrElseE = ET.getOrElseE(R.Monad)
export const left = ET.left(R.Monad)
export const fromResumeL = ET.leftF(R.Monad)
export const map = ET.map(R.Monad)
export const mapLeft = ET.mapLeft(R.Monad)
export const match = ET.match(R.Monad)
export const matchE = ET.matchE(R.Monad)
export const orElse = ET.orElse(R.Monad)
export const orElseFirst = ET.orElseFirst(R.Monad)
export const orLeft = ET.orLeft(R.Monad)
export const right = ET.right(R.Monad)
export const fromResumeR = ET.rightF(R.Monad)
export const swap = ET.swap(R.Functor)
export const toUnion = ET.toUnion(R.Functor)

export const URI = '@typed/fp/ResumeEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ResumeEither<E, A>
  }
}

declare module './Hkt' {
  export interface UriToVariance {
    [URI]: V<E, Covariant>
  }
}

export const Pointed: Pointed2<URI> = {
  of: flow(E.right, R.of),
}

export const of = Pointed.of

export const Functor: Functor2<URI> = {
  map,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

export const ChainRec: ChainRec2<URI> = {
  chainRec: (f) => R.chainRec(flow(f, R.map(swapEithers))),
}

export const chainRec = ChainRec.chainRec

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Monad: Monad2<URI> = {
  ...Applicative,
  chain,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

export const Bifunctor: Bifunctor2<URI> = {
  ...Functor,
  bimap,
  mapLeft,
}
