import * as Env from './Env'
import * as E from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import * as FR from 'fp-ts/FromReader'
import * as FRe from './FromResume'
import * as FE from './FromEnv'
import { Semigroup } from 'fp-ts/Semigroup'
import { Kind } from './Hkt'
import { Pointed3 } from 'fp-ts/Pointed'
import { flow, pipe } from 'fp-ts/function'
import { Functor3 } from 'fp-ts/Functor'
import { Apply3 } from 'fp-ts/Apply'
import { Applicative3 } from 'fp-ts/Applicative'
import { Chain3 } from 'fp-ts/Chain'
import { Monad3 } from 'fp-ts/Monad'
import { ChainRec3 } from 'fp-ts/ChainRec'
import { MonadRec3 } from './MonadRec'
import { FromIO3 } from 'fp-ts/FromIO'
import { FromTask3 } from 'fp-ts/FromTask'
import { FromResume3 } from './FromResume'
import { Resume } from './Resume'
import { Bifunctor3 } from 'fp-ts/Bifunctor'
import { Alt3 } from 'fp-ts/Alt'
import { FromReader3 } from 'fp-ts/FromReader'
import { FromEnv3 } from './FromEnv'
import { Provide3, ProvideAll3, ProvideSome3, UseAll3, UseSome3 } from './Provide'

export interface EnvEither<R, E, A> extends Kind<[Env.URI, E.URI], [R, E, A]> {}

export const alt = ET.alt(Env.Monad)
export const altValidation = <A>(semigroup: Semigroup<A>) => ET.altValidation(Env.Monad, semigroup)
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
  export interface VarianceMap {
    [URI]: V<R, Contravariant> & V<E, Covariant>
  }
}

export const Pointed: Pointed3<URI> = {
  of: flow(E.right, Env.of),
}

export const Functor: Functor3<URI> = {
  map,
}

export const Bifunctor: Bifunctor3<URI> = {
  bimap,
  mapLeft,
}

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain3<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

const swapEithers = <E, A, B>(either: E.Either<E, E.Either<A, B>>): E.Either<A, E.Either<E, B>> => {
  if (E.isLeft(either)) {
    return E.right(either)
  }

  const e = either.right

  if (E.isLeft(e)) {
    return e
  }

  return E.right(e)
}

export const chainRec = <A, R, E, B>(f: (value: A) => EnvEither<R, E, E.Either<A, B>>) => (
  a: A,
): EnvEither<R, E, B> =>
  pipe(
    a,
    Env.chainRec((x) => pipe(x, f, Env.map(swapEithers))),
  )

export const ChainRec: ChainRec3<URI> = {
  chainRec,
}

export const MonadRec: MonadRec3<URI> = {
  ...Monad,
  chainRec,
}

export const FromIO: FromIO3<URI> = {
  fromIO: flow(Env.fromIO, Env.map(E.right)),
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask3<URI> = {
  ...FromIO,
  fromTask: flow(Env.fromTask, Env.map(E.right)),
}

export const fromTask = FromTask.fromTask

export const FromResume: FromResume3<URI> = {
  fromResume: <A, R>(resume: Resume<A>) => pipe(Env.fromResume<A, R>(resume), Env.map(E.right)),
}

export const fromResume = FromResume.fromResume

export const FromReader: FromReader3<URI> = {
  fromReader: flow(Env.fromReader, Env.map(E.right)),
}

export const fromReader = FromReader.fromReader

export const FromEnv: FromEnv3<URI> = {
  fromEnv,
}

export const Alt: Alt3<URI> = {
  ...Functor,
  alt,
}

export const UseSome: UseSome3<URI> = {
  useSome: Env.useSome,
}

export const UseAll: UseAll3<URI> = {
  useAll: Env.useAll,
}

export const ProvideSome: ProvideSome3<URI> = {
  provideSome: Env.provideSome,
}

export const ProvideAll: ProvideAll3<URI> = {
  provideAll: Env.provideAll,
}

export const Provide: Provide3<URI> = {
  ...UseAll,
  ...UseSome,
  ...ProvideSome,
  ...ProvideAll,
}

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
