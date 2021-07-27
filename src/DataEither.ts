import * as Alt_ from 'fp-ts/Alt'
import * as Applicative_ from 'fp-ts/Applicative'
import * as Apply_ from 'fp-ts/Apply'
import * as Bifunctor_ from 'fp-ts/Bifunctor'
import * as Chain_ from 'fp-ts/Chain'
import * as ChainRec_ from 'fp-ts/ChainRec'
import * as Ei from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import * as FEi from 'fp-ts/FromEither'
import { flow, pipe } from 'fp-ts/function'
import * as Functor_ from 'fp-ts/Functor'
import * as Monad_ from 'fp-ts/Monad'
import * as Pointed_ from 'fp-ts/Pointed'
import * as Semigroup_ from 'fp-ts/Semigroup'

import * as D from './Data'
import { swapEithers } from './internal'
import { MonadRec2 } from './MonadRec'

export type DataEither<E, A> = D.Data<Ei.Either<E, A>>

export const alt = ET.alt(D.Monad)
export const altValidation = <A>(semigroup: Semigroup_.Semigroup<A>) =>
  ET.altValidation(D.Monad, semigroup)
export const ap = ET.ap(D.Apply)
export const bimap = ET.bimap(D.Functor)
export const bracket = ET.bracket(D.Monad)
export const chain = ET.chain(D.Monad)
export const getOrElse = ET.getOrElse(D.Monad)
export const getOrElseE = ET.getOrElseE(D.Monad)
export const left = ET.left(D.Monad)
export const fromEnvL = ET.leftF(D.Monad)
export const map = ET.map(D.Monad)
export const mapLeft = ET.mapLeft(D.Monad)
export const match = ET.match(D.Monad)
export const matchE = ET.matchE(D.Monad)
export const orElse = ET.orElse(D.Monad)
export const orElseFirst = ET.orElseFirst(D.Monad)
export const orLeft = ET.orLeft(D.Monad)
export const right = ET.right(D.Monad)
export const fromEnv = ET.rightF(D.Monad)
export const swap = ET.swap(D.Functor)
export const toUnion = ET.toUnion(D.Functor)

export const URI = '@typed/fp/DataEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: DataEither<E, A>
  }
}

export const of = flow(Ei.right, D.of)

export const Pointed: Pointed_.Pointed2<URI> = {
  of,
}

export const Functor: Functor_.Functor2<URI> = {
  map,
}

export const bindTo = Functor_.bindTo(Functor)
export const flap = Functor_.flap(Functor)
export const tupled = Functor_.tupled(Functor)

export const Bifunctor: Bifunctor_.Bifunctor2<URI> = {
  bimap,
  mapLeft,
}

export const Apply: Apply_.Apply2<URI> = {
  ...Functor,
  ap,
}

export const apFirst = Apply_.apFirst(Apply)
export const apS = Apply_.apS(Apply)
export const apSecond = Apply_.apSecond(Apply)
export const apT = Apply_.apT(Apply)
export const getSemigroup = Apply_.getApplySemigroup(Apply)

export const Applicative: Applicative_.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain_.Chain2<URI> = {
  ...Functor,
  chain,
}

export const bind = Chain_.bind(Chain)

export const chainFirst = Chain_.chainFirst(Chain) as <A, E, B>(
  f: (a: A) => DataEither<E, B>,
) => (first: DataEither<E, A>) => DataEither<E, A>

export const Monad: Monad_.Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const chainRec =
  <A, E, B>(f: (value: A) => DataEither<E, Ei.Either<A, B>>) =>
  (a: A): DataEither<E, B> =>
    pipe(
      a,
      D.chainRec((x) => pipe(x, f, D.map(swapEithers))),
    )

export const ChainRec: ChainRec_.ChainRec2<URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

export const fromEither = <E, A>(e: Ei.Either<E, A>): DataEither<E, A> => D.Replete(e)

export const FromEither: FEi.FromEither2<URI> = {
  fromEither,
}
export const Alt: Alt_.Alt2<URI> = {
  ...Functor,
  alt,
}

export const chainEitherK = FEi.chainEitherK(FromEither, Chain)
export const chainOptionK = FEi.chainOptionK(FromEither, Chain)
export const filterOrElse = FEi.filterOrElse(FromEither, Chain)
export const fromEitherK = FEi.fromEitherK(FromEither)
export const fromOption = FEi.fromOption(FromEither)
export const fromOptionK = FEi.fromOptionK(FromEither)
export const fromPredicate = FEi.fromPredicate(FromEither)
