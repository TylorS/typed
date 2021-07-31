/**
 * DataOption is an ADT which allows you to represent all the states involved in loading a
 * piece of data asynchronously which might exist.
 *
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

import * as D from './Data'
import { MonadRec1 } from './MonadRec'

/**
 * @since 0.9.2
 * @category Model
 */
export type DataOption<A> = D.Data<O.Option<A>>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = OT.alt(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = OT.ap(D.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = OT.chain(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainNullableK = OT.chainNullableK(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainOptionK = OT.chainOptionK(D.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = OT.fromEither(D.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromData = OT.fromF(D.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullable = OT.fromNullable(D.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullableK = OT.fromNullableK(D.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOptionK = OT.fromOptionK(D.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromPredicate = OT.fromPredicate(D.Pointed)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = OT.getOrElse(D.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = OT.getOrElseE(D.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = OT.map(D.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = OT.match(D.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = OT.matchE(D.Chain)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const some = OT.some(D.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const zero = OT.zero(D.Pointed)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/DataOption'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: DataOption<A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed1<URI> = {
  of: flow(O.some, D.of),
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
export const chainRec = <A, B>(f: (value: A) => DataOption<E.Either<A, B>>) =>
  D.chainRec(
    flow(
      f,
      D.map((oe) => {
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
