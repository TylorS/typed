/**
 * DataEither is an ADT which allows you to represent all the states involved in loading a
 * piece of data asynchronously which might fail.
 *
 * @since 0.9.2
 */
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

/**
 * @since 0.9.2
 * @category Model
 */
export type DataEither<E, A> = D.Data<Ei.Either<E, A>>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = ET.alt(D.Monad)
/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const altValidation = <A>(semigroup: Semigroup_.Semigroup<A>) =>
  ET.altValidation(D.Monad, semigroup)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = ET.ap(D.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bimap = ET.bimap(D.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bracket = ET.bracket(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = ET.chain(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = ET.getOrElse(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = ET.getOrElseE(D.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const left = ET.left(D.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromDataL = ET.leftF(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = ET.map(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const mapLeft = ET.mapLeft(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const match = ET.match(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const matchE = ET.matchE(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElse = ET.orElse(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElseFirst = ET.orElseFirst(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orLeft = ET.orLeft(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const right = ET.right(D.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromData = ET.rightF(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const swap = ET.swap(D.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const toUnion = ET.toUnion(D.Functor)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/DataEither'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: DataEither<E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<E, Contravariant>
  }
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const of = flow(Ei.right, D.of)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed_.Pointed2<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor_.Functor2<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindTo = Functor_.bindTo(Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const flap = Functor_.flap(Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const tupled = Functor_.tupled(Functor)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Bifunctor: Bifunctor_.Bifunctor2<URI> = {
  bimap,
  mapLeft,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply_.Apply2<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apFirst = Apply_.apFirst(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apS = Apply_.apS(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSecond = Apply_.apSecond(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apT = Apply_.apT(Apply)

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getSemigroup = Apply_.getApplySemigroup(Apply)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative_.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Chain_.Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bind = Chain_.bind(Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirst = Chain_.chainFirst(Chain) as <A, E, B>(
  f: (a: A) => DataEither<E, B>,
) => (first: DataEither<E, A>) => DataEither<E, A>

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad_.Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, E, B>(f: (value: A) => DataEither<E, Ei.Either<A, B>>) =>
  (a: A): DataEither<E, B> =>
    pipe(
      a,
      D.chainRec((x) => pipe(x, f, D.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec_.ChainRec2<URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = <E, A>(e: Ei.Either<E, A>): DataEither<E, A> => D.replete(e)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEither: FEi.FromEither2<URI> = {
  fromEither,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: Alt_.Alt2<URI> = {
  ...Functor,
  alt,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainEitherK = FEi.chainEitherK(FromEither, Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainOptionK = FEi.chainOptionK(FromEither, Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const filterOrElse = FEi.filterOrElse(FromEither, Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const fromEitherK = FEi.fromEitherK(FromEither)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const fromOption = FEi.fromOption(FromEither)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const fromOptionK = FEi.fromOptionK(FromEither)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const fromPredicate = FEi.fromPredicate(FromEither)

/**
 * @since 0.12.1
 * @category Consturctor
 */
export const noData: DataEither<never, never> = D.noData

/**
 * @since 0.12.1
 * @category Consturctor
 */
export const loading: DataEither<never, never> = D.loading

/**
 * @since 0.12.1
 * @category Constructor
 */
export const fromProgress = flow(D.fromProgress, fromData)

/**
 * @since 0.12.1
 * @category Combinator
 */
export const toLoading = <E, A>(de: DataEither<E, A>): DataEither<E, A> => pipe(de, D.toLoading)

/**
 * @since 0.12.1
 * @category Constructor
 */
export const refresh = flow(D.refresh, fromData)

/**
 * @since 0.12.1
 * @category Constructor
 */
export const replete = flow(D.replete, fromData)
