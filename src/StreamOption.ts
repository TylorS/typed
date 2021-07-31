/**
 * StreamOption is a OptionT of Stream
 * @since 0.9.2
 */
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as Ei from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed1 } from 'fp-ts/Pointed'

import { MonadRec1 } from './MonadRec'
import * as S from './Stream'

/**
 * @since 0.9.2
 * @category Model
 */
export interface StreamOption<A> extends S.Stream<O.Option<A>> {}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = OT.alt(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = OT.ap(S.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = OT.chain(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainNullableK = OT.chainNullableK(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainOptionK = OT.chainOptionK(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = OT.fromEither(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStream = OT.fromF(S.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullable = OT.fromNullable(S.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromNullableK = OT.fromNullableK(S.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOptionK = OT.fromOptionK(S.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromPredicate = OT.fromPredicate(S.Pointed)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = OT.getOrElse(S.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = OT.getOrElseE(S.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = OT.map(S.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const match = OT.match(S.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const matchE = OT.matchE(S.Chain)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const some = OT.some(S.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const zero = OT.zero(S.Pointed)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/StreamOption'

/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: StreamOption<A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed1<URI> = {
  of: flow(O.some, S.of),
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
export const chainRec =
  <A, B>(f: (value: A) => StreamOption<Ei.Either<A, B>>) =>
  (value: A): StreamOption<B> =>
    pipe(
      value,
      S.chainRec((a) =>
        pipe(
          a,
          f,
          S.map((oe) => {
            if (O.isNone(oe)) {
              return Ei.right(oe)
            }

            return pipe(oe.value, Ei.map(O.some))
          }),
        ),
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
  chainRec,
}
