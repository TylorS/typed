import { MonadRec1 } from '@fp/MonadRec'
import * as S from '@fp/Stream'
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

export interface StreamOption<A> extends S.Stream<O.Option<A>> {}

export const alt = OT.alt(S.Monad)
export const ap = OT.ap(S.Apply)
export const chain = OT.chain(S.Monad)
export const chainNullableK = OT.chainNullableK(S.Monad)
export const chainOptionK = OT.chainOptionK(S.Monad)
export const fromEither = OT.fromEither(S.Monad)
export const fromEnv = OT.fromF(S.Monad)
export const fromNullable = OT.fromNullable(S.Pointed)
export const fromNullableK = OT.fromNullableK(S.Pointed)
export const fromOptionK = OT.fromOptionK(S.Pointed)
export const fromPredicate = OT.fromPredicate(S.Pointed)
export const getOrElse = OT.getOrElse(S.Functor)
export const getOrElseE = OT.getOrElseE(S.Monad)
export const map = OT.map(S.Functor)
export const match = OT.match(S.Functor)
export const matchE = OT.matchE(S.Chain)
export const some = OT.some(S.Pointed)
export const zero = OT.zero(S.Pointed)

export const URI = '@typed/fp/StreamOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: StreamOption<A>
  }
}

export const Pointed: Pointed1<URI> = {
  of: flow(O.some, S.of),
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

export const chainRec = <A, B>(f: (value: A) => StreamOption<Ei.Either<A, B>>) => (
  value: A,
): StreamOption<B> =>
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

export const ChainRec: ChainRec1<URI> = {
  chainRec,
}

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const MonadRec: MonadRec1<URI> = {
  ...Monad,
  chainRec,
}
