/**
 * StateEnvEither is a StateT of EnvEither. Resume-based altenative to
 * StateReaderTaskEither that support cancelation.
 * @since 0.9.2
 */
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
import { pipe } from 'fp-ts/function'
import { Functor4 } from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { Monad4 } from 'fp-ts/Monad'
import { Pointed4 } from 'fp-ts/Pointed'
import * as ST from 'fp-ts/StateT'
import { Task } from 'fp-ts/Task'

import { Env } from './Env'
import * as EE from './EnvEither'
import { FromEnv4 } from './FromEnv'
import * as FE from './FromEnv'
import { FromResume4 } from './FromResume'
import * as FRe from './FromResume'
import { MonadRec4 } from './MonadRec'
import { Provide4, ProvideAll4, ProvideSome4, UseAll4, UseSome4 } from './Provide'
import { Reader } from './Reader'
import * as R from './Resume'

/**
 * @since 0.9.2
 * @category Model
 */
export interface StateEnvEither<S, R, E, A> {
  (state: S): EE.EnvEither<R, E, readonly [value: A, nextState: S]>
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = ST.ap(EE.Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = ST.chain(EE.Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const evaluate = ST.evaluate(EE.Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const execute = ST.execute(EE.Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnvEither = ST.fromF(EE.Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromState = ST.fromState(EE.Pointed)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = ST.map(EE.Functor)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const of = ST.of(EE.Pointed)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/StateEnvEither'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind4<S, R, E, A> {
    [URI]: StateEnvEither<S, R, E, A>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed4<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: Functor4<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Apply4<URI> = {
  ...Functor,
  ap,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: Applicative4<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Chain4<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad4<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainRec =
  <A, S, R, E, B>(f: (a: A) => StateEnvEither<S, R, E, E.Either<A, B>>) =>
  (value: A) =>
  (s: S) =>
  (r: R): R.Resume<E.Either<E, readonly [B, S]>> => {
    let resume = f(value)(s)(r)

    while (R.isSync(resume)) {
      const either = resume.resume()

      if (E.isLeft(either)) {
        return R.of(either)
      }

      const result = either.right
      s = result[1]

      if (E.isRight(result[0])) {
        return R.of(E.right([result[0].right, s]))
      }

      resume = f(result[0].left)(s)(r)
    }

    return pipe(
      resume,
      R.chain((e) =>
        E.isLeft(e)
          ? R.of(e)
          : pipe(
              e.right[0],
              E.matchW(
                (a) => chainRec(f)(a)(e.right[1])(r),
                (b) => R.of(E.right<readonly [B, S], E>([b, e.right[1]])),
              ),
            ),
      ),
    )
  }

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec4<URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec4<URI> = {
  ...Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEither = <E, A, S = unknown, R = unknown>(
  either: E.Either<E, A>,
): StateEnvEither<S, R, E, A> => fromEnvEither(EE.fromEither(either))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEither: FromEither4<URI> = {
  fromEither,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIO = <A, S = unknown, R = unknown, E = never>(
  io: IO<A>,
): StateEnvEither<S, R, E, A> => fromEnvEither(EE.fromIO(io))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromIO: FromIO4<URI> = {
  fromIO,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTask = <A, S = unknown, R = unknown, E = never>(
  io: Task<A>,
): StateEnvEither<S, R, E, A> => fromEnvEither(EE.fromTask(io))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FromTask4<URI> = {
  ...FromIO,
  fromTask,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResume = <A, S = unknown, R = unknown, E = never>(
  resume: R.Resume<A>,
): StateEnvEither<S, R, E, A> => fromEnvEither(EE.fromResume(resume))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromResume: FromResume4<URI> = {
  fromResume,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromEnv = <R, A, S = unknown, E = never>(env: Env<R, A>): StateEnvEither<S, R, E, A> =>
  fromEnvEither(EE.fromEnv(env))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromEnv: FromEnv4<URI> = {
  fromEnv,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromState: FromState4<URI> = {
  fromState,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReader = <R, A, S = unknown, E = never>(
  reader: Reader<R, A>,
): StateEnvEither<S, R, E, A> => fromEnvEither(EE.fromReader(reader))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromReader: FromReader4<URI> = { fromReader }

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

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainStateK = FS.chainStateK(FromState, Chain)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromStateK = FS.fromStateK(FromState)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const get = FS.get(FromState)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const gets = FS.gets(FromState)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const modify = FS.modify(FromState)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const put = FS.put(FromState)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <R1>(provided: R1) =>
  <S, R2, E, A>(srte: StateEnvEither<S, R1 & R2, E, A>): StateEnvEither<S, R2, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...r, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <R1>(provided: R1) =>
  <S, R2, E, A>(srte: StateEnvEither<S, R1 & R2, E, A>): StateEnvEither<S, R2, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...provided, ...r })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <R>(provided: R) =>
  <S, E, A>(srte: StateEnvEither<S, R, E, A>): StateEnvEither<S, unknown, E, A> =>
  (s) =>
  () =>
    srte(s)(provided)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <R>(provided: R) =>
  <S, E, A>(srte: StateEnvEither<S, R, E, A>): StateEnvEither<S, unknown, E, A> =>
  (s) =>
  (r) =>
    srte(s)({ ...provided, ...(r as {}) })

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: UseSome4<URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: UseAll4<URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: ProvideSome4<URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: ProvideAll4<URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: Provide4<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
