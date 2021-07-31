/**
 * StreamEither is a EitherT of Stream
 * @since 0.9.2
 */
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

/**
 * @since 0.9.2
 * @category Model
 */
export interface StreamEither<E, A> extends S.Stream<E.Either<E, A>> {}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = ET.alt(S.Monad)

/**
 * @since 0.9.2
 * @category Typecalss Constructor
 */
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(S.Monad, semigroup)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = ET.ap(S.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bimap = ET.bimap(S.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bracket = ET.bracket(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = ET.chain(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = ET.getOrElse(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = ET.getOrElseE(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const left = ET.left(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStreamL = ET.leftF(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = ET.map(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const mapLeft = ET.mapLeft(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const match = ET.match(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const matchE = ET.matchE(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElse = ET.orElse(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElseFirst = ET.orElseFirst(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orLeft = ET.orLeft(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const right = ET.right(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStream = ET.rightF(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const swap = ET.swap(S.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const toUnion = ET.toUnion(S.Functor)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/StreamEither'

/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: StreamEither<E, A>
  }
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const of = flow(E.right, now)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed2<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor2<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Bifunctor: Bifunctor2<URI> = {
  bimap,
  mapLeft,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, E, B>(f: (value: A) => StreamEither<E, E.Either<A, B>>) =>
  (a: A): StreamEither<E, B> =>
    pipe(
      a,
      S.chainRec((x) => pipe(x, f, S.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<URI> = {
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
