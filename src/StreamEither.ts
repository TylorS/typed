import { now } from '@most/core'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Bifunctor2 } from 'fp-ts/Bifunctor'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import { Semigroup } from 'fp-ts/Semigroup'

import { flow, pipe } from './function'
import { swapEithers } from './internal'
import { MonadRec2 } from './MonadRec'
import * as S from './Stream'

export interface StreamEither<E, A> extends S.Stream<E.Either<E, A>> {}

export const alt = ET.alt(S.Monad)
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(S.Monad, semigroup)
export const ap = ET.ap(S.Apply)
export const bimap = ET.bimap(S.Functor)
export const bracket = ET.bracket(S.Monad)
export const chain = ET.chain(S.Monad)
export const getOrElse = ET.getOrElse(S.Monad)
export const getOrElseE = ET.getOrElseE(S.Monad)
export const left = ET.left(S.Monad)
export const fromStreamL = ET.leftF(S.Monad)
export const map = ET.map(S.Monad)
export const mapLeft = ET.mapLeft(S.Monad)
export const match = ET.match(S.Monad)
export const matchE = ET.matchE(S.Monad)
export const orElse = ET.orElse(S.Monad)
export const orElseFirst = ET.orElseFirst(S.Monad)
export const orLeft = ET.orLeft(S.Monad)
export const right = ET.right(S.Monad)
export const fromStream = ET.rightF(S.Monad)
export const swap = ET.swap(S.Functor)
export const toUnion = ET.toUnion(S.Functor)

export const URI = '@typed/fp/StreamEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: StreamEither<E, A>
  }
}

export const of = flow(E.right, now)

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
  map,
}

export const Bifunctor: Bifunctor2<URI> = {
  bimap,
  mapLeft,
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

export const chainRec =
  <A, E, B>(f: (value: A) => StreamEither<E, E.Either<A, B>>) =>
  (a: A): StreamEither<E, B> =>
    pipe(
      a,
      S.chainRec((x) => pipe(x, f, S.map(swapEithers))),
    )

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}
