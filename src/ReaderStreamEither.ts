import { MonadRec3 } from '@fp/MonadRec'
import * as RS from '@fp/ReaderStream'
import { never } from '@fp/Stream'
import * as SE from '@fp/StreamEither'
import { flow } from 'cjs/function'
import * as ALT from 'fp-ts/Alt'
import * as ALTERNATIVE from 'fp-ts/Alternative'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Bi from 'fp-ts/Bifunctor'
import * as Ch from 'fp-ts/Chain'
import { ChainRec3 } from 'fp-ts/ChainRec'
import * as Ei from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import * as FEi from 'fp-ts/FromEither'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import { Lazy } from 'fp-ts/function'
import * as F from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'
import { Semigroup } from 'fp-ts/Semigroup'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface ReaderStreamEither<R, E, A> extends Re.Reader<R, SE.StreamEither<E, A>> {}

export type RequirementsOf<A> = A extends ReaderStreamEither<infer R, any, any> ? R : never
export type LeftOf<A> = A extends ReaderStreamEither<any, infer R, any> ? R : never
export type RightOf<A> = A extends ReaderStreamEither<any, any, infer R> ? R : never

export const ap = RT.ap(SE.Apply)
export const apW = ap as <R1, E, A>(
  fa: Re.Reader<R1, SE.StreamEither<E, A>>,
) => <R2, B>(
  fab: Re.Reader<R2, SE.StreamEither<E, (a: A) => B>>,
) => Re.Reader<R1 & R2, SE.StreamEither<E, B>>
export const chain = RT.chain(SE.Chain)
export const chainW = chain as <A, R1, E, B>(
  f: (a: A) => Re.Reader<R1, SE.StreamEither<E, B>>,
) => <R2>(ma: Re.Reader<R2, SE.StreamEither<E, A>>) => Re.Reader<R1 & R2, SE.StreamEither<E, B>>
export const fromReader = RT.fromReader(SE.Pointed)
export const map = RT.map(SE.Functor)
export const of = RT.of(SE.Pointed)

export const alt = ET.alt(RS.Monad)
export const altW = alt as <R1, E, A>(
  second: Lazy<RS.ReaderStream<R1, Ei.Either<E, A>>>,
) => <R2>(first: RS.ReaderStream<R2, Ei.Either<E, A>>) => RS.ReaderStream<R1 & R2, Ei.Either<E, A>>
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(RS.Monad, semigroup)
export const bimap = ET.bimap(RS.Functor)
export const bracket = ET.bracket(RS.Monad)
export const bracketW = bracket as <R1, E, A, R2, B, R3>(
  acquire: RS.ReaderStream<R1, Ei.Either<E, A>>,
  use: (a: A) => RS.ReaderStream<R2, Ei.Either<E, B>>,
  release: (a: A, e: Ei.Either<E, B>) => RS.ReaderStream<R3, Ei.Either<E, void>>,
) => RS.ReaderStream<R1 & R2 & R3, Ei.Either<E, B>>
export const getOrElse = ET.getOrElse(RS.Monad)
export const getOrElseE = ET.getOrElseE(RS.Monad)
export const getOrElseEW = getOrElseE as <E, R1, A>(
  onLeft: (e: E) => RS.ReaderStream<R1, A>,
) => <R2>(ma: RS.ReaderStream<R2, Ei.Either<E, A>>) => RS.ReaderStream<R1 & R2, A>
export const left = ET.left(RS.Monad)
export const fromReaderStreamL = ET.leftF(RS.Monad)
export const mapLeft = ET.mapLeft(RS.Monad)
export const match = ET.match(RS.Monad)
export const matchE = ET.matchE(RS.Monad)
export const matchEW = match as <E, R1, B, A, R2>(
  onLeft: (e: E) => RS.ReaderStream<R1, B>,
  onRight: (a: A) => RS.ReaderStream<R2, B>,
) => <R3>(
  ma: RS.ReaderStream<R3, Ei.Either<E, A>>,
) => RS.ReaderStream<R1 & R2 & R3, Ei.Either<E, B>>

export const orElse = ET.orElse(RS.Monad)
export const orElseFirst = ET.orElseFirst(RS.Monad)
export const orLeft = ET.orLeft(RS.Monad)
export const right = ET.right(RS.Monad)
export const fromReaderStream = ET.rightF(RS.Monad)
export const swap = ET.swap(RS.Functor)
export const toUnion = ET.toUnion(RS.Functor)

export const URI = '@typed/fp/ReaderStreamEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: ReaderStreamEither<R, E, A>
  }
}

declare module '@fp/Hkt' {
  export interface UriToVariance {
    [URI]: V<R, Contravariant> & V<E, Covariant>
  }
}

export const Pointed: Pointed3<URI> = {
  of,
}

export const Functor: F.Functor3<URI> = {
  map,
}

export const bindTo = F.bindTo(Functor)
export const flap = F.flap(Functor)
export const tupled = F.tupled(Functor)

export const Bifunctor: Bi.Bifunctor3<URI> = {
  ...Functor,
  bimap,
  mapLeft,
}

export const Apply: Ap.Apply3<URI> = {
  ...Functor,
  ap,
}

export const apFirst = Ap.apFirst(Apply)
export const apS = Ap.apS(Apply)
export const apSecond = Ap.apSecond(Apply)
export const apT = Ap.apT(Apply)
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: App.Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

export const Chain: Ch.Chain3<URI> = {
  ...Functor,
  chain,
}

export const bind = Ch.bind(Chain)
export const chainFirst = Ch.chainFirst(Chain)

export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

export function chainRec<A, R, E, B>(
  f: (value: A) => ReaderStreamEither<R, E, Ei.Either<A, B>>,
): (value: A) => ReaderStreamEither<R, E, B> {
  return (value) => (env) => SE.chainRec((a: A) => f(a)(env))(value)
}

export const ChainRec: ChainRec3<URI> = {
  chainRec,
}

export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

export const Alt: ALT.Alt3<URI> = {
  ...Functor,
  alt,
}

export const altAll = ALT.altAll(Alt)

export const zero: ReaderStreamEither<unknown, never, any> = () => never()

export const Alternative: ALTERNATIVE.Alternative3<URI> = {
  ...Alt,
  zero: () => zero,
}

export const FromEither: FEi.FromEither3<URI> = {
  fromEither: RS.of,
}

export const fromEither = FromEither.fromEither
export const chainEitherK = FEi.chainEitherK(FromEither, Chain)
export const chainOptionK = FEi.chainOptionK(FromEither, Chain)
export const filterOrElse = FEi.filterOrElse(FromEither, Chain)
export const fromEitherK = FEi.fromEitherK(FromEither)
export const fromOption = FEi.fromOption(FromEither)
export const fromOptionK = FEi.fromOptionK(FromEither)
export const fromPredicate = FEi.fromPredicate(FromEither)

export const FromReader: FR.FromReader3<URI> = {
  fromReader,
}

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
export const chainFirstReaderK = FR.chainFirstReaderK(FromReader, Chain)
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
export const fromReaderK = FR.fromReaderK(FromReader)

export const FromIO: FIO.FromIO3<URI> = {
  fromIO: flow(RS.fromIO, fromReaderStream),
}

export const fromIO = FromIO.fromIO
export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const fromIOK = FIO.fromIOK(FromIO)

export const FromTask: FT.FromTask3<URI> = {
  ...FromIO,
  fromTask: flow(RS.fromTask, fromReaderStream),
}

export const fromTask = FromTask.fromTask

export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
export const fromTaskK = FT.fromTaskK(FromTask)
