/**
 * ResumeOption is an Option of @see Resume
 * @since 0.9.2
 */
import { Alt1 } from 'fp-ts/Alt'
import { Alternative1 } from 'fp-ts/Alternative'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed1 } from 'fp-ts/Pointed'

import { MonadRec1 } from './MonadRec'
import * as R from './Resume'

/**
 * @since 0.9.2
 * @category Model
 */
export type ResumeOption<A> = R.Resume<O.Option<A>>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = OT.alt(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = OT.ap(R.Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = OT.chain(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainNullableK = OT.chainNullableK(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainOptionK = OT.chainOptionK(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = OT.fromEither(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResume = OT.fromF(R.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullable = OT.fromNullable(R.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullableK = OT.fromNullableK(R.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOptionK = OT.fromOptionK(R.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromPredicate = OT.fromPredicate(R.Pointed)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElse = OT.getOrElse(R.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const getOrElseE = OT.getOrElseE(R.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = OT.map(R.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = OT.match(R.Functor)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = OT.matchE(R.Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const some = OT.some(R.Pointed)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const zero = OT.zero(R.Pointed)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ResumeOption'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: ResumeOption<A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed1<URI> = {
  of: flow(O.some, R.of),
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor1<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Chain1<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec = <A, B>(f: (value: A) => ResumeOption<E.Either<A, B>>) =>
  R.chainRec(
    flow(
      f,
      R.map((oe) => {
        if (O.isNone(oe)) {
          return E.right(oe)
        }

        return pipe(oe.value, E.map(O.some))
      }),
    ),
  )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec1<URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec1<URI> = {
  ...Monad,
  ...ChainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: Alt1<URI> = {
  ...Functor,
  alt,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alternative: Alternative1<URI> = {
  ...Alt,
  zero,
}
