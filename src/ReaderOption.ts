import { Alt2 } from 'fp-ts/Alt'
import { Alternative2 } from 'fp-ts/Alternative'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as Ei from 'fp-ts/Either'
import { FromIO2 } from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import { FromReader2 } from 'fp-ts/FromReader'
import { flow, Lazy, pipe } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed2 } from 'fp-ts/Pointed'

import { MonadRec2 } from './MonadRec'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'
import * as R from './Reader'

export interface ReaderOption<E, A> extends R.Reader<E, O.Option<A>> {}

export const alt = OT.alt(R.Monad)
export const altW = OT.alt(R.Monad) as <E1, A>(
  second: Lazy<R.Reader<E1, O.Option<A>>>,
) => <E2, B>(first: R.Reader<E2, O.Option<B>>) => R.Reader<E1 & E2, O.Option<A | B>>
export const ap = OT.ap(R.Apply)
export const chain = OT.chain(R.Monad)
export const chainNullableK = OT.chainNullableK(R.Monad)
export const chainOptionK = OT.chainOptionK(R.Monad)
export const fromEither = OT.fromEither(R.Monad)
export const fromReader = OT.fromF(R.Monad)
export const fromNullable = OT.fromNullable(R.Pointed)
export const fromNullableK = OT.fromNullableK(R.Pointed)
export const fromOptionK = OT.fromOptionK(R.Pointed)
export const fromPredicate = OT.fromPredicate(R.Pointed)
export const getOrElse = OT.getOrElse(R.Functor)
export const getOrElseE = OT.getOrElseE(R.Monad)
export const getOrElseEW = OT.getOrElseE(R.Monad) as <E1, A>(
  onNone: Lazy<R.Reader<E1, A>>,
) => <E2, B>(fa: R.Reader<E2, O.Option<B>>) => R.Reader<E1 & E2, A | B>
export const map = OT.map(R.Functor)
export const match = OT.match(R.Functor)
export const matchE = OT.matchE(R.Chain)
export const some = OT.some(R.Pointed)
export const zero = OT.zero(R.Pointed)

export const URI = '@typed/fp/ReaderOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReaderOption<E, A>
  }
}

declare module './Hkt' {
  export interface UriToVariance {
    [URI]: V<E, Contravariant>
  }
}

export const Pointed: Pointed2<URI> = {
  of: flow(O.some, R.of),
}

export const Functor: Functor2<URI> = {
  map,
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

export const chainRec = <A, E, B>(f: (value: A) => ReaderOption<E, Ei.Either<A, B>>) => (
  value: A,
): ReaderOption<E, B> =>
  pipe(
    value,
    R.chainRec((a) =>
      pipe(
        a,
        f,
        R.map((oe) => {
          if (O.isNone(oe)) {
            return Ei.right(oe)
          }

          return pipe(oe.value, Ei.map(O.some))
        }),
      ),
    ),
  )

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

export const Alternative: Alternative2<URI> = {
  ...Alt,
  zero,
}

export const FromIO: FromIO2<URI> = {
  fromIO: fromReader,
}

export const fromIO = FromIO.fromIO

export const FromReader: FromReader2<URI> = {
  fromReader,
}

export const UseSome: UseSome2<URI> = {
  useSome: R.useSome,
}

export const UseAll: UseAll2<URI> = {
  useAll: R.useAll,
}

export const ProvideSome: ProvideSome2<URI> = {
  provideSome: R.provideSome,
}

export const ProvideAll: ProvideAll2<URI> = {
  provideAll: R.provideAll,
}

export const Provide: Provide2<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
export const chainFirstReaderK = FR.chainFirstReaderK(FromReader, Chain)
export const fromReaderK = FR.fromReaderK(FromReader)
export const local = <A, B>(f: (a: A) => B) => <C>(ro: ReaderOption<B, C>): ReaderOption<A, C> => (
  a,
) => ro(f(a))
