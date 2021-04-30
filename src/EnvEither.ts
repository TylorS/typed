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
import { IO } from 'fp-ts/IO'
import * as Monad_ from 'fp-ts/Monad'
import * as Pointed_ from 'fp-ts/Pointed'
import { Reader } from 'fp-ts/Reader'
import * as Semigroup_ from 'fp-ts/Semigroup'
import { Task } from 'fp-ts/Task'

import * as Env from './Env'
import * as FE from './FromEnv'
import * as FRe from './FromResume'
import { swapEithers } from './internal'
import { MonadRec3 } from './MonadRec'
import * as P from './Provide'
import { Resume, sync } from './Resume'

export interface EnvEither<R, E, A> extends Env.Env<R, E.Either<E, A>> {}

export const alt = ET.alt(Env.Monad)
export const altValidation = <A>(semigroup: Semigroup_.Semigroup<A>) =>
  ET.altValidation(Env.Monad, semigroup)
export const ap = ET.ap(Env.Apply)
export const bimap = ET.bimap(Env.Functor)
export const bracket = ET.bracket(Env.Monad)
export const chain = ET.chain(Env.Monad)
export const getOrElse = ET.getOrElse(Env.Monad)
export const getOrElseE = ET.getOrElseE(Env.Monad)
export const left = ET.left(Env.Monad)
export const fromEnvL = ET.leftF(Env.Monad)
export const map = ET.map(Env.Monad)
export const mapLeft = ET.mapLeft(Env.Monad)
export const match = ET.match(Env.Monad)
export const matchE = ET.matchE(Env.Monad)
export const orElse = ET.orElse(Env.Monad)
export const orElseFirst = ET.orElseFirst(Env.Monad)
export const orLeft = ET.orLeft(Env.Monad)
export const right = ET.right(Env.Monad)
export const fromEnv = ET.rightF(Env.Monad)
export const swap = ET.swap(Env.Functor)
export const toUnion = ET.toUnion(Env.Functor)

export const URI = '@typed/fp/EnvEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: EnvEither<R, E, A>
  }
}

declare module './Hkt' {
  export interface UriToVariance {
    [URI]: V<R, Contravariant> & V<E, Covariant>
  }
}

export const of = flow(E.right, Env.of)

export const Pointed: Pointed_.Pointed3<URI> = {
  of,
}

export const Functor: Functor_.Functor3<URI> = {
  map,
}

export const bindTo = Functor_.bindTo(Functor)
export const flap = Functor_.flap(Functor)
export const tupled = Functor_.tupled(Functor)

export const Bifunctor: Bifunctor_.Bifunctor3<URI> = {
  bimap,
  mapLeft,
}

export const Apply: Apply_.Apply3<URI> = {
  ...Functor,
  ap,
}

export const apFirst = Apply_.apFirst(Apply)
export const apS = Apply_.apS(Apply)
export const apSecond = Apply_.apSecond(Apply)
export const apT = Apply_.apT(Apply)
export const getSemigroup = Apply_.getApplySemigroup(Apply)

export const Applicative: Applicative_.Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain_.Chain3<URI> = {
  ...Functor,
  chain,
}

export const bind = Chain_.bind(Chain)

export const chainFirst = Chain_.chainFirst(Chain) as <A, R1, E, B>(
  f: (a: A) => EnvEither<R1, E, B>,
) => <R2>(first: EnvEither<R2, E, A>) => EnvEither<R1 & R2, E, A>

export const Monad: Monad_.Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

export const chainRec = <A, R, E, B>(f: (value: A) => EnvEither<R, E, E.Either<A, B>>) => (
  a: A,
): EnvEither<R, E, B> =>
  pipe(
    a,
    Env.chainRec((x) => pipe(x, f, Env.map(swapEithers))),
  )

export const ChainRec: ChainRec_.ChainRec3<URI> = {
  chainRec,
}

export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

export const fromEither = <E, A, R = unknown>(e: E.Either<E, A>): EnvEither<R, E, A> => () =>
  sync(() => e)

export const FromEither: FEi.FromEither3<URI> = {
  fromEither,
}

export const FromIO: FIO.FromIO3<URI> = {
  fromIO: flow(Env.fromIO, Env.map(E.right)),
}

export const fromIO = FromIO.fromIO as <A, R = unknown, E = never>(fa: IO<A>) => EnvEither<R, E, A>

export const FromTask: FT.FromTask3<URI> = {
  ...FromIO,
  fromTask: flow(Env.fromTask, Env.map(E.right)),
}

export const fromTask = FromTask.fromTask as <A, R = unknown, E = never>(
  fa: Task<A>,
) => EnvEither<R, E, A>

export const FromResume: FRe.FromResume3<URI> = {
  fromResume: <A, R>(resume: Resume<A>) => pipe(Env.fromResume<A, R>(resume), Env.map(E.right)),
}

export const fromResume = FromResume.fromResume

export const FromReader: FR.FromReader3<URI> = {
  fromReader: flow(Env.fromReader, Env.map(E.right)),
}

export const fromReader = FromReader.fromReader as <R, A, E = never>(
  fa: Reader<R, A>,
) => EnvEither<R, E, A>

export const FromEnv: FE.FromEnv3<URI> = {
  fromEnv,
}

export const Alt: Alt_.Alt3<URI> = {
  ...Functor,
  alt,
}

export const UseSome: P.UseSome3<URI> = {
  useSome: Env.useSome,
}

export const UseAll: P.UseAll3<URI> = {
  useAll: Env.useAll,
}

export const ProvideSome: P.ProvideSome3<URI> = {
  provideSome: Env.provideSome,
}

export const ProvideAll: P.ProvideAll3<URI> = {
  provideAll: Env.provideAll,
}

export const Provide: P.Provide3<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...FromReader, ...Chain })
export const askAndUse = P.askAndUse({ ...UseAll, ...FromReader, ...Chain })
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...FromReader, ...Chain })
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...FromReader, ...Chain })
export const useAllWith = P.useAllWith({ ...UseAll, ...FromReader, ...Chain })
export const useSomeWith = P.useSomeWith({ ...UseSome, ...FromReader, ...Chain })

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
export const fromReaderK = FR.fromReaderK(FromReader)

export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
export const fromResumeK = FRe.fromResumeK(FromResume)

export const chainEnvK = FE.chainEnvK(FromEnv, Chain)
export const chainFirstEnvK = FE.chainFirstEnvK(FromEnv, Chain)
export const fromEnvK = FE.fromEnvK(FromEnv)

export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
export const fromTaskK = FT.fromTaskK(FromTask)

export const chainFirstIOK = FIO.chainFirstIOK(FromTask, Chain)
export const chainIOK = FIO.chainIOK(FromTask, Chain)
export const fromIOK = FIO.fromIOK(FromTask)

export const chainEitherK = FEi.chainEitherK(FromEither, Chain)
export const chainOptionK = FEi.chainOptionK(FromEither, Chain)
export const filterOrElse = FEi.filterOrElse(FromEither, Chain)
export const fromEitherK = FEi.fromEitherK(FromEither)
export const fromOption = FEi.fromOption(FromEither)
export const fromOptionK = FEi.fromOptionK(FromEither)
export const fromPredicate = FEi.fromPredicate(FromEither)
