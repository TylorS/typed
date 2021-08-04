/**
 * EnvEither is an EitherT of [Env](./Env.ts.md)
 * @since 0.9.2
 */
import * as Alt_ from 'fp-ts/Alt'
import * as Applicative_ from 'fp-ts/Applicative'
import * as Apply_ from 'fp-ts/Apply'
import * as Bifunctor_ from 'fp-ts/Bifunctor'
import * as Chain_ from 'fp-ts/Chain'
import * as ChainRec_ from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import * as FEi from 'fp-ts/FromEither'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import { flow, pipe } from 'fp-ts/function'
import * as Functor_ from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import * as Monad_ from 'fp-ts/Monad'
import * as Pointed_ from 'fp-ts/Pointed'
import { Reader } from 'fp-ts/Reader'
import * as Semigroup_ from 'fp-ts/Semigroup'
import * as T from 'fp-ts/Task'

import * as Env from './Env'
import * as FE from './FromEnv'
import * as FRe from './FromResume'
import { swapEithers } from './internal'
import { MonadRec3 } from './MonadRec'
import * as P from './Provide'
import { Resume, sync } from './Resume'

/**
 * @since 0.9.2
 * @category Model
 */
export interface EnvEither<R, E, A> extends Env.Env<R, E.Either<E, A>> {}

/**
 * @since 0.10.0
 * @category Model
 */
export interface Of<E, A> extends EnvEither<unknown, E, A> {}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = ET.alt(Env.Monad)

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const altValidation = <A>(semigroup: Semigroup_.Semigroup<A>) =>
  ET.altValidation(Env.Monad, semigroup)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = ET.ap(Env.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bimap = ET.bimap(Env.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bracket = ET.bracket(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = ET.chain(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainW = chain as <A, ME1, E, B>(
  f: (a: A) => Env.Env<ME1, E.Either<E, B>>,
) => <ME2>(ma: Env.Env<ME2, E.Either<E, A>>) => Env.Env<ME1 & ME2, E.Either<E, B>>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = ET.getOrElse(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElseE = ET.getOrElseE(Env.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const left = ET.left(Env.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnvL = ET.leftF(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = ET.map(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const mapLeft = ET.mapLeft(Env.Monad)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = ET.match(Env.Monad)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = ET.matchE(Env.Monad)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const orElse = ET.orElse(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orElseFirst = ET.orElseFirst(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const orLeft = ET.orLeft(Env.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const right = ET.right(Env.Monad)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnv = ET.rightF(Env.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const swap = ET.swap(Env.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const toUnion = ET.toUnion(Env.Functor)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/EnvEither'

/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: EnvEither<R, E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<R, Contravariant> & V<E, Covariant>
  }
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const of = flow(E.right, Env.of)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed_.Pointed3<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor_.Functor3<URI> = {
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
export const Bifunctor: Bifunctor_.Bifunctor3<URI> = {
  bimap,
  mapLeft,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply_.Apply3<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apFirst = Apply_.apFirst(Apply)

/**
 * @since 0.9.10
 * @category Combinator
 */
export const apFirstW = Apply_.apFirst(Apply) as <R1, E, B>(
  second: EnvEither<R1, E, B>,
) => <R2, A>(first: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, A>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apS = Apply_.apS(Apply)

/**
 * @since 0.9.10
 * @category Combinator
 */
export const apSW = apS as <N extends string, A, R1, E, B>(
  name: Exclude<N, keyof A>,
  fb: EnvEither<R1, E, B>,
) => <R2>(
  fa: EnvEither<R2, E, A>,
) => EnvEither<R1 & R2, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSecond = Apply_.apSecond(Apply)

/**
 * @since 0.9.10
 * @category Combinator
 */
export const apSecondW = apSecond as <R1, E, B>(
  second: EnvEither<R1, E, B>,
) => <R2, A>(first: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, B>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apT = Apply_.apT(Apply)

/**
 * @since 0.9.10
 * @category Combinator
 */
export const apTW = apT as <R1, E, B>(
  fb: EnvEither<R1, E, B>,
) => <R2, A extends readonly unknown[]>(
  fas: EnvEither<R2, E, A>,
) => EnvEither<R1 & R2, E, readonly [...A, B]>

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getSemigroup = Apply_.getApplySemigroup(Apply)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative_.Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Chain_.Chain3<URI> = {
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
export const chainFirst = Chain_.chainFirst(Chain) as <A, R, E, B>(
  f: (a: A) => EnvEither<R, E, B>,
) => (first: EnvEither<R, E, A>) => EnvEither<R, E, A>

/**
 * @since 0.9.11
 * @category Combinator
 */
export const chainFirstW = Chain_.chainFirst(Chain) as <A, R1, E1, B>(
  f: (a: A) => EnvEither<R1, E1, B>,
) => <R2, E2>(first: EnvEither<R2, E2, A>) => EnvEither<R1 & R2, E1 | E2, A>

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad_.Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, R, E, B>(f: (value: A) => EnvEither<R, E, E.Either<A, B>>) =>
  (a: A): EnvEither<R, E, B> =>
    pipe(
      a,
      Env.chainRec((x) => pipe(x, f, Env.map(swapEithers))),
    )

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec_.ChainRec3<URI> = {
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
 * @category Constructor
 */
export const fromEither =
  <E, A, R = unknown>(e: E.Either<E, A>): EnvEither<R, E, A> =>
  () =>
    sync(() => e)

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEither: FEi.FromEither3<URI> = {
  fromEither,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromIO: FIO.FromIO3<URI> = {
  fromIO: flow(Env.fromIO, Env.map(E.right)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIO = FromIO.fromIO as <A, R = unknown, E = never>(
  fa: IO.IO<A>,
) => EnvEither<R, E, A>

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FT.FromTask3<URI> = {
  ...FromIO,
  fromTask: flow(Env.fromTask, Env.map(E.right)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTask = FromTask.fromTask as <A, R = unknown, E = never>(
  fa: T.Task<A>,
) => EnvEither<R, E, A>

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromResume: FRe.FromResume3<URI> = {
  fromResume: <A, R>(resume: Resume<A>) => pipe(Env.fromResume<A, R>(resume), Env.map(E.right)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResume = FromResume.fromResume

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromReader: FR.FromReader3<URI> = {
  fromReader: flow(Env.fromReader, Env.map(E.right)),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReader = FromReader.fromReader as <R, A, E = never>(
  fa: Reader<R, A>,
) => EnvEither<R, E, A>

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEnv: FE.FromEnv3<URI> = {
  fromEnv,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: Alt_.Alt3<URI> = {
  ...Functor,
  alt,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: P.UseSome3<URI> = {
  useSome: Env.useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: P.UseAll3<URI> = {
  useAll: Env.useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: P.ProvideSome3<URI> = {
  provideSome: Env.provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: P.ProvideAll3<URI> = {
  provideAll: Env.provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide3<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...FromReader, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndUse = P.askAndUse({ ...UseAll, ...FromReader, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...FromReader, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...FromReader, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAllWith = P.useAllWith({ ...UseAll, ...FromReader, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSomeWith = P.useSomeWith({ ...UseSome, ...FromReader, ...Chain })

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
export const chainReaderK = FR.chainReaderK(FromReader, Chain)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReaderK = FR.fromReaderK(FromReader)

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
 * @category Combinator
 */
export const chainEnvK = FE.chainEnvK(FromEnv, Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstEnvK = FE.chainFirstEnvK(FromEnv, Chain)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnvK = FE.fromEnvK(FromEnv)

/**
 * @since 0.9.15
 * @category Combinator
 */
export const provideAllWithEnv = FE.provideAllWithEnv({ ...FromEnv, ...ProvideAll, ...Chain })

/**
 * @since 0.9.15
 * @category Combinator
 */
export const provideSomeWithEnv = FE.provideSomeWithEnv({ ...FromEnv, ...ProvideSome, ...Chain })

/**
 * @since 0.9.15
 * @category Combinator
 */
export const useAllWithEnv = FE.useAllWithEnv({ ...FromEnv, ...UseAll, ...Chain })

/**
 * @since 0.9.15
 * @category Combinator
 */
export const useSomeWithEnv = FE.useSomeWithEnv({ ...FromEnv, ...UseSome, ...Chain })

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
 * @category Combinator
 */
export const chainFirstIOK = FIO.chainFirstIOK(FromTask, Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainIOK = FIO.chainIOK(FromTask, Chain)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIOK = FIO.fromIOK(FromTask)

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
