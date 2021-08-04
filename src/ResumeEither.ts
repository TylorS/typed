/**
 * ResumeEither is an Either of [Resume](./Resume.ts.md)
 * @since 0.9.2
 */
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

/**
 * @since 0.9.2
 * @category Model
 */
export type ResumeEither<E, A> = R.Resume<E.Either<E, A>>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = ET.alt(R.Monad)
/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(R.Monad, semigroup)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = ET.ap(R.Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bimap = ET.bimap(R.Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bracket = ET.bracket(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = ET.chain(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = ET.getOrElse(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = ET.getOrElseE(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const left = ET.left(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResumeL = ET.leftF(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = ET.map(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const mapLeft = ET.mapLeft(R.Monad)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = ET.match(R.Monad)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = ET.matchE(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElse = ET.orElse(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElseFirst = ET.orElseFirst(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const orLeft = ET.orLeft(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const right = ET.right(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResumeR = ET.rightF(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const swap = ET.swap(R.Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const toUnion = ET.toUnion(R.Functor)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ResumeEither'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ResumeEither<E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<E, Covariant>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed2<URI> = {
  of: flow(E.right, R.of),
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const of = Pointed.of

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
export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<URI> = {
  chainRec: (f) => R.chainRec(flow(f, R.map(swapEithers))),
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec = ChainRec.chainRec

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
export const Monad: Monad2<URI> = {
  ...Applicative,
  chain,
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
 * @category Instance
 */
export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Bifunctor: Bifunctor2<URI> = {
  ...Functor,
  bimap,
  mapLeft,
}
