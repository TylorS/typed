import { Applicative4 } from 'fp-ts/Applicative'
import { Apply4 } from 'fp-ts/Apply'
import { Chain4 } from 'fp-ts/Chain'
import { ChainRec4 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { FromEither4 } from 'fp-ts/FromEither'
import * as FEi from 'fp-ts/FromEither'
import { FromIO4 } from 'fp-ts/FromIO'
import * as FIO from 'fp-ts/FromIO'
import { FromReader4 } from 'fp-ts/FromReader'
import * as FR from 'fp-ts/FromReader'
import { FromState4 } from 'fp-ts/FromState'
import * as FS from 'fp-ts/FromState'
import { FromTask4 } from 'fp-ts/FromTask'
import * as FT from 'fp-ts/FromTask'
import { flow, pipe } from 'fp-ts/function'
import { Functor4 } from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { Monad4 } from 'fp-ts/Monad'
import { Pointed4 } from 'fp-ts/Pointed'
import * as ST from 'fp-ts/StateT'
import { Task } from 'fp-ts/Task'

import { Env } from './Env'
import { FromEnv4 } from './FromEnv'
import * as FE from './FromEnv'
import { FromResume4 } from './FromResume'
import * as FRe from './FromResume'
import { MonadRec4 } from './MonadRec'
import { Provide4, ProvideAll4, ProvideSome4, UseAll4, UseSome4 } from './Provide'
import { Reader } from './Reader'
import * as RSE from './ReaderStreamEither'
import * as R from './Resume'

export interface StateReaderStreamEither<S, R, E, A> {
  (state: S): RSE.ReaderStreamEither<R, E, readonly [value: A, nextState: S]>
}

export const ap = ST.ap(RSE.Chain)
export const chain = ST.chain(RSE.Chain)
export const evaluate = ST.evaluate(RSE.Chain)
export const execute = ST.execute(RSE.Chain)
export const fromEnvEither = ST.fromF(RSE.Chain)
export const fromState = ST.fromState(RSE.Pointed)
export const map = ST.map(RSE.Functor)
export const of = ST.of(RSE.Pointed)

export const URI = '@typed/fp/StateReaderStreamEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind4<S, R, E, A> {
    [URI]: StateReaderStreamEither<S, R, E, A>
  }
}

export const Pointed: Pointed4<URI> = {
  of,
}

export const Functor: Functor4<URI> = {
  map,
}

export const Apply: Apply4<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative4<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain4<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad4<URI> = {
  ...Chain,
  ...Pointed,
}

export const chainRec =
  <A, S, R, E, B>(f: (a: A) => StateReaderStreamEither<S, R, E, E.Either<A, B>>) =>
  (value: A): StateReaderStreamEither<S, R, E, B> =>
    flow(
      f(value),
      RSE.chain(([either, nextState]) =>
        pipe(
          either,
          E.matchW(
            (a) => chainRec(f)(a)(nextState),
            (b) => RSE.right([b, nextState]),
          ),
        ),
      ),
    )

export const ChainRec: ChainRec4<URI> = {
  chainRec,
}

export const MonadRec: MonadRec4<URI> = {
  ...Monad,
  chainRec,
}

export const fromEither = <E, A, S = unknown, R = unknown>(
  either: E.Either<E, A>,
): StateReaderStreamEither<S, R, E, A> => fromEnvEither(RSE.fromEither(either))

export const FromEither: FromEither4<URI> = {
  fromEither,
}

export const fromIO = <A, S = unknown, R = unknown, E = never>(
  io: IO<A>,
): StateReaderStreamEither<S, R, E, A> => fromEnvEither(RSE.fromIO(io))

export const FromIO: FromIO4<URI> = {
  fromIO,
}

export const fromTask = <A, S = unknown, R = unknown, E = never>(
  io: Task<A>,
): StateReaderStreamEither<S, R, E, A> => fromEnvEither(RSE.fromTask(io))

export const FromTask: FromTask4<URI> = {
  ...FromIO,
  fromTask,
}

export const fromResume = <A, S = unknown, R = unknown, E = never>(
  resume: R.Resume<A>,
): StateReaderStreamEither<S, R, E, A> => fromEnvEither(RSE.fromResume(resume))

export const FromResume: FromResume4<URI> = {
  fromResume,
}

export const fromEnv = <R, A, S = unknown, E = never>(
  env: Env<R, A>,
): StateReaderStreamEither<S, R, E, A> => fromEnvEither(RSE.fromEnv(env))

export const FromEnv: FromEnv4<URI> = {
  fromEnv,
}

export const FromState: FromState4<URI> = {
  fromState,
}

export const fromReader = <R, A, S = unknown, E = never>(
  reader: Reader<R, A>,
): StateReaderStreamEither<S, R, E, A> => fromEnvEither(RSE.fromReader(reader))

export const FromReader: FromReader4<URI> = { fromReader }

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

export const chainStateK = FS.chainStateK(FromState, Chain)
export const fromStateK = FS.fromStateK(FromState)
export const get = FS.get(FromState)
export const gets = FS.gets(FromState)
export const modify = FS.modify(FromState)
export const put = FS.put(FromState)

export const useSome =
  <R1>(provided: R1) =>
  <S, R2, E, A>(
    srte: StateReaderStreamEither<S, R1 & R2, E, A>,
  ): StateReaderStreamEither<S, R2, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...r, ...provided })

export const provideSome =
  <R1>(provided: R1) =>
  <S, R2, E, A>(
    srte: StateReaderStreamEither<S, R1 & R2, E, A>,
  ): StateReaderStreamEither<S, R2, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...provided, ...r })

export const useAll =
  <R>(provided: R) =>
  <S, E, A>(srte: StateReaderStreamEither<S, R, E, A>): StateReaderStreamEither<S, unknown, E, A> =>
  (s) =>
  () =>
    srte(s)(provided)

export const provideAll =
  <R>(provided: R) =>
  <S, E, A>(srte: StateReaderStreamEither<S, R, E, A>): StateReaderStreamEither<S, unknown, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...provided, ...(r as {}) })

export const UseSome: UseSome4<URI> = {
  useSome,
}

export const UseAll: UseAll4<URI> = {
  useAll,
}

export const ProvideSome: ProvideSome4<URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll4<URI> = {
  provideAll,
}

export const Provide: Provide4<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
