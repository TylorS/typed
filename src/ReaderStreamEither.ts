/**
 * ReaderStreamEither is an EitherT of ReaderStream, allowing for you to
 * represent your application over time with Stream, with support for branching/error-handling
 * through Either, and dependency injection from Reader.
 *
 * @since 0.9.2
 */
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

import * as FE from './FromEnv'
import * as FRe from './FromResume'
import * as FS from './FromStream'
import { flow } from './function'
import { MonadRec3 } from './MonadRec'
import * as RS from './ReaderStream'
import * as S from './Stream'
import * as SE from './StreamEither'

/**
 * Env is specialization of Reader<R, Resume<A>>
 * @since 0.9.2
 * @category Model
 */
export interface ReaderStreamEither<R, E, A> extends Re.Reader<R, SE.StreamEither<E, A>> {}

/**
 * @since 0.9.2
 * @category Type-level
 */
export type RequirementsOf<A> = A extends ReaderStreamEither<infer R, any, any> ? R : never
/**
 * @since 0.9.2
 * @category Type-lvel
 */
export type LeftOf<A> = A extends ReaderStreamEither<any, infer R, any> ? R : never
/**
 * @since 0.9.2
 * @category Type-lvel
 */
export type RightOf<A> = A extends ReaderStreamEither<any, any, infer R> ? R : never

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = RT.ap(SE.Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apW = ap as <R1, E, A>(
  fa: Re.Reader<R1, SE.StreamEither<E, A>>,
) => <R2, B>(
  fab: Re.Reader<R2, SE.StreamEither<E, (a: A) => B>>,
) => Re.Reader<R1 & R2, SE.StreamEither<E, B>>
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = RT.chain(SE.Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainW = chain as <A, R1, E, B>(
  f: (a: A) => Re.Reader<R1, SE.StreamEither<E, B>>,
) => <R2>(ma: Re.Reader<R2, SE.StreamEither<E, A>>) => Re.Reader<R1 & R2, SE.StreamEither<E, B>>
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReader = RT.fromReader(SE.Pointed)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = RT.map(SE.Functor)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const of = RT.of(SE.Pointed)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = ET.alt(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const altW = alt as <R1, E, A>(
  second: Lazy<RS.ReaderStream<R1, Ei.Either<E, A>>>,
) => <R2>(first: RS.ReaderStream<R2, Ei.Either<E, A>>) => RS.ReaderStream<R1 & R2, Ei.Either<E, A>>
/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(RS.Monad, semigroup)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bimap = ET.bimap(RS.Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bracket = ET.bracket(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bracketW = bracket as <R1, E, A, R2, B, R3>(
  acquire: RS.ReaderStream<R1, Ei.Either<E, A>>,
  use: (a: A) => RS.ReaderStream<R2, Ei.Either<E, B>>,
  release: (a: A, e: Ei.Either<E, B>) => RS.ReaderStream<R3, Ei.Either<E, void>>,
) => RS.ReaderStream<R1 & R2 & R3, Ei.Either<E, B>>
/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = ET.getOrElse(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = ET.getOrElseE(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseEW = getOrElseE as <E, R1, A>(
  onLeft: (e: E) => RS.ReaderStream<R1, A>,
) => <R2>(ma: RS.ReaderStream<R2, Ei.Either<E, A>>) => RS.ReaderStream<R1 & R2, A>
/**
 * @since 0.9.2
 * @category Constructor
 */
export const left = ET.left(RS.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReaderStreamL = ET.leftF(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const mapLeft = ET.mapLeft(RS.Monad)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = ET.match(RS.Monad)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = ET.matchE(RS.Monad)
/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchEW = match as <E, R1, B, A, R2>(
  onLeft: (e: E) => RS.ReaderStream<R1, B>,
  onRight: (a: A) => RS.ReaderStream<R2, B>,
) => <R3>(
  ma: RS.ReaderStream<R3, Ei.Either<E, A>>,
) => RS.ReaderStream<R1 & R2 & R3, Ei.Either<E, B>>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElse = ET.orElse(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElseFirst = ET.orElseFirst(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const orLeft = ET.orLeft(RS.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const right = ET.right(RS.Monad)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReaderStream = ET.rightF(RS.Monad)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const swap = ET.swap(RS.Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const toUnion = ET.toUnion(RS.Functor)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ReaderStreamEither'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: ReaderStreamEither<R, E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<R, Contravariant> & V<E, Covariant>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed3<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: F.Functor3<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindTo = F.bindTo(Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const flap = F.flap(Functor)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const tupled = F.tupled(Functor)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Bifunctor: Bi.Bifunctor3<URI> = {
  ...Functor,
  bimap,
  mapLeft,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Ap.Apply3<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apFirst = Ap.apFirst(Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apS = Ap.apS(Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSecond = Ap.apSecond(Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apT = Ap.apT(Apply)
/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: App.Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Typeclass Consructor
 */
export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Ch.Chain3<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bind = Ch.bind(Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirst = Ch.chainFirst(Chain)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function chainRec<A, R, E, B>(
  f: (value: A) => ReaderStreamEither<R, E, Ei.Either<A, B>>,
): (value: A) => ReaderStreamEither<R, E, B> {
  return (value) => (env) => SE.chainRec((a: A) => f(a)(env))(value)
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec3<URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: ALT.Alt3<URI> = {
  ...Functor,
  alt,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const altAll = ALT.altAll(Alt)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const zero: ReaderStreamEither<unknown, never, any> = S.empty

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alternative: ALTERNATIVE.Alternative3<URI> = {
  ...Alt,
  zero: () => zero,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEither: FEi.FromEither3<URI> = {
  fromEither: RS.of,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = FromEither.fromEither
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
 * @category Constructor
 */
export const fromEitherK = FEi.fromEitherK(FromEither)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOption = FEi.fromOption(FromEither)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromOptionK = FEi.fromOptionK(FromEither)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromPredicate = FEi.fromPredicate(FromEither)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromReader: FR.FromReader3<URI> = {
  fromReader,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const ask = FR.ask(FromReader)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const asks = FR.asks(FromReader)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstReaderK = FR.chainFirstReaderK(FromReader, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReaderK = FR.fromReaderK(FromReader)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromIO: FIO.FromIO3<URI> = {
  fromIO: flow(RS.fromIO, fromReaderStream),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIO = FromIO.fromIO
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainIOK = FIO.chainIOK(FromIO, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIOK = FIO.fromIOK(FromIO)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FT.FromTask3<URI> = {
  ...FromIO,
  fromTask: flow(RS.fromTask, fromReaderStream),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTask = FromTask.fromTask

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTaskK = FT.fromTaskK(FromTask)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromStream: FS.FromStream3<URI> = {
  fromStream: flow(RS.fromStream, RS.map(Ei.right)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStream = FromStream.fromStream
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstStreamK = FS.chainFirstStreamK(FromStream, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainStreamK = FS.chainStreamK(FromStream, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStreamK = FS.fromStreamK(FromStream)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromResume: FRe.FromResume3<URI> = {
  fromResume: flow(
    RS.fromResume,
    RS.map((x) => Ei.right(x)),
  ),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResume = FromResume.fromResume
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResumeK = FRe.fromResumeK(FromResume)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEnv: FE.FromEnv3<URI> = {
  fromEnv: flow(
    RS.fromEnv,
    RS.map((x) => Ei.right(x)),
  ),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnv = FromEnv.fromEnv
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstEnvK = FE.chainFirstEnvK(FromEnv, Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainEnvK = FE.chainEnvK(FromEnv, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnvK = FE.fromEnvK(FromEnv)
