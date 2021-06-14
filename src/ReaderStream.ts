import * as FE from '@fp/FromEnv'
import * as FRe from '@fp/FromResume'
import { Arity1 } from '@fp/function'
import { MonadRec2 } from '@fp/MonadRec'
import * as S from '@fp/Stream'
import { flow } from 'cjs/function'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import * as F from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface ReaderStream<R, A> extends Re.Reader<R, S.Stream<A>> {}

export type GetRequirements<A> = A extends ReaderStream<infer R, any> ? R : never
export type GetValue<A> = A extends ReaderStream<any, infer R> ? R : never

export const ap = RT.ap(S.Apply)

export const apW = ap as <R1, A>(
  fa: ReaderStream<R1, A>,
) => <R2, B>(fab: ReaderStream<R2, Arity1<A, B>>) => ReaderStream<R1 & R2, B>

export const chain = RT.chain(S.Chain)
export const chainW = chain as <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>,
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>

export const fromReader: <R, A>(ma: Re.Reader<R, A>) => ReaderStream<R, A> = RT.fromReader(
  S.Pointed,
)

export const map: <A, B>(f: (a: A) => B) => <R>(fa: ReaderStream<R, A>) => ReaderStream<R, B> =
  RT.map(S.Functor)

export const of: <A, R = unknown>(a: A) => ReaderStream<R, A> = RT.of(S.Pointed)

export function chainRec<A, E, B>(
  f: (value: A) => ReaderStream<E, Either<A, B>>,
): (value: A) => ReaderStream<E, B> {
  return (value) => (env) => S.chainRec((a: A) => f(a)(env))(value)
}

export const URI = '@typed/fp/ReaderStream'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReaderStream<E, A>
  }
}

declare module '@fp/Hkt' {
  export interface UriToVariance {
    [URI]: V<E, Contravariant>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: F.Functor2<URI> = {
  map,
}

export const bindTo = F.bindTo(Functor)
export const flap = F.flap(Functor)
export const tupled = F.tupled(Functor)

export const Apply: Ap.Apply2<URI> = {
  ...Functor,
  ap,
}

export const apFirst = Ap.apFirst(Apply)
export const apFirstW = apFirst as <E1, B>(
  second: ReaderStream<E1, B>,
) => <E2, A>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
export const apS = Ap.apS(Apply)
export const apSW = apS as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderStream<E1, B>,
) => <E2>(
  fa: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
export const apSecond = Ap.apSecond(Apply)
export const apSecondW = apSecond as <E1, B>(
  second: ReaderStream<E1, B>,
) => <E2, A>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, B>
export const apT = Ap.apT(Apply)
export const apTW = apT as <E1, B>(
  fb: ReaderStream<E1, B>,
) => <E2, A extends readonly unknown[]>(
  fas: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, readonly [...A, B]>
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: App.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

export const Chain: Ch.Chain2<URI> = {
  ...Functor,
  chain,
}

export const chainFirst = Ch.chainFirst(Chain)
export const chainFirstW = chainFirst as <A, E1, B>(
  f: (a: A) => ReaderStream<E1, B>,
) => <E2>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
export const bind = Ch.bind(Chain)

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

export const FromReader: FR.FromReader2<URI> = {
  fromReader,
}

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
export const chainFirstReaderK = FR.chainFirstReaderK(FromReader, Chain)
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
export const fromReaderK = FR.fromReaderK(FromReader)

export const FromResume: FRe.FromResume2<URI> = {
  fromResume: (r) => () => S.fromResume(r),
}

export const fromResume = FromResume.fromResume

export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
export const fromResumeK = FRe.fromResumeK(FromResume)

export const FromEnv: FE.FromEnv2<URI> = {
  fromEnv: (env) => flow(env, S.fromResume),
}

export const fromEnv = FromEnv.fromEnv
export const chainEnvK = FE.chainEnvK(FromEnv, Chain)
export const chainFirstEnvK = FE.chainFirstEnvK(FromEnv, Chain)
export const fromEnvK = FE.fromEnvK(FromEnv)

export const FromIO: FIO.FromIO2<URI> = {
  fromIO: (io) => () => S.fromIO(io),
}

export const fromIO = FromIO.fromIO

export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const fromIOK = FIO.fromIOK(FromIO)

export const FromTask: FT.FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => S.fromTask(task),
}

export const fromTask = FromTask.fromTask

export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
export const fromTaskK = FT.fromTaskK(FromTask)
