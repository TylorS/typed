import * as E from 'fp-ts/Alt'
import * as FpApplicative from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as FpChain from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import { constant, flow, identity, Lazy } from 'fp-ts/function'
import { bindTo as bindTo_, flap as flap_, Functor2, tupled as tupled_ } from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'
import { traverse } from 'fp-ts/ReadonlyArray'
import * as Task from 'fp-ts/Task'

import * as FRe from './FromResume'
import { FromResume2 } from './FromResume'
import { Arity1 } from './function'
import { Intersect } from './Hkt'
import { MonadRec2 } from './MonadRec'
import * as P from './Provide'
import * as R from './Resume'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface Env<R, A> extends Re.Reader<R, R.Resume<A>> {}

export type GetRequirements<A> = A extends Env<infer R, any> ? R : never
export type GetValue<A> = A extends Env<any, infer R> ? R : never

export const ap: <R, A>(fa: Env<R, A>) => <B>(fab: Env<R, Arity1<A, B>>) => Env<R, B> = RT.ap(
  R.Apply,
)

export const chain = RT.chain(R.Chain) as <A, R1, B>(
  f: (a: A) => Env<R1, B>,
) => <R2>(ma: Env<R2, A>) => Env<R1 & R2, B>

export const fromReader: <R, A>(ma: Re.Reader<R, A>) => Env<R, A> = RT.fromReader(R.Pointed)

export const map: <A, B>(f: (a: A) => B) => <R>(fa: Env<R, A>) => Env<R, B> = RT.map(R.Functor)

export const of: <A, R = unknown>(a: A) => Env<R, A> = RT.of(R.Pointed)

export const asksIOK: <R, A>(f: (r: R) => IO.IO<A>) => Env<R, A> = RT.fromNaturalTransformation<
  IO.URI,
  R.URI
>(R.fromIO)

export const asksTaskK: <R, A>(f: (r: R) => Task.Task<A>) => Env<R, A> =
  RT.fromNaturalTransformation<Task.URI, R.URI>(R.fromTask)

export function chainRec<A, E, B>(
  f: (value: A) => Env<E, E.Either<A, B>>,
): (value: A) => Env<E, B> {
  return (value) => (env) => R.chainRec((a: A) => f(a)(env))(value)
}

export const URI = '@typed/fp/Env'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Env<E, A>
  }
}

declare module './Hkt' {
  export interface UriToVariance {
    [URI]: V<E, Contravariant>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const flap = flap_(Functor)

export const Apply: Ap.Apply2<URI> = {
  ...Functor,
  ap,
}

export const apS = Ap.apS(Apply)
export const apSW = apS as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: Env<E1, B>,
) => <E2>(
  fa: Env<E2, A>,
) => Env<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

export const apT = Ap.apT(Apply)
export const apTW = apT as <E1, B>(
  fb: Env<E1, B>,
) => <E2, A extends readonly unknown[]>(fas: Env<E2, A>) => Env<E1 & E2, readonly [...A, B]>

export const apFirst = Ap.apFirst(Apply)
export const apFirstW = apFirst as <E1, B>(
  second: Env<E1, B>,
) => <E2, A>(first: Env<E2, A>) => Env<E1 & E2, A>

export const apSecond = Ap.apSecond(Apply)
export const apSecondW = apSecond as <E1, B>(
  second: Env<E1, B>,
) => <E2, A>(first: Env<E2, A>) => Env<E1 & E2, B>

export const getSemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: FpApplicative.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const getMonoid = FpApplicative.getApplicativeMonoid(Applicative)

export const Chain: FpChain.Chain2<URI> = {
  ...Functor,
  chain,
}

export const chainFirst = FpChain.chainFirst(Chain)
export const chainFirstW = chainFirst as <A, E1, B>(
  f: (a: A) => Env<E1, B>,
) => <E2>(first: Env<E2, A>) => Env<E1 & E2, A>

export const flattenW = chain(identity) as <E1, E2, A>(env: Env<E1, Env<E2, A>>) => Env<E1 & E2, A>
export const flatten = chain(identity) as <E, A>(env: Env<E, Env<E, A>>) => Env<E, A>

export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec2<URI> = {
  URI,
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

export const FromReader: FR.FromReader2<URI> = {
  fromReader: (reader) => (e) => R.sync(() => reader(e)),
}

export const raceW =
  <E1, A>(a: Env<E1, A>) =>
  <E2, B>(b: Env<E2, B>): Env<E1 & E2, A | B> =>
  (e) =>
    R.race(a(e))(b(e))

export const race =
  <E, A>(a: Env<E, A>) =>
  <B>(b: Env<E, B>): Env<E, A | B> =>
  (e) =>
    R.race(a(e))(b(e))

export const Alt: E.Alt2<URI> = {
  ...Functor,
  alt:
    <E, A>(snd: Lazy<Env<E, A>>) =>
    (fst: Env<E, A>) =>
      raceW(fst)(snd()),
}

export const alt = Alt.alt
export const altW = alt as <E1, A>(
  snd: Lazy<Env<E1, A>>,
) => <E2>(fst: Env<E2, A>) => Env<E1 & E2, A>

export const altAll = E.altAll(Alt)

export const fromIO = fromReader as <A>(fa: IO.IO<A>) => Env<unknown, A>

export const FromIO: FIO.FromIO2<URI> = {
  URI,
  fromIO,
}

export const FromTask: FT.FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => R.fromTask(task),
}

export const fromTask = FromTask.fromTask as <A, E = unknown>(fa: Task.Task<A>) => Env<E, A>

export const fromResume: <A, E = unknown>(resume: R.Resume<A>) => Env<E, A> = constant

export const FromResume: FromResume2<URI> = {
  fromResume,
}

export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> =>
  (e) =>
    env({ ...e, ...provided })

export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> =>
  (e) =>
    env({ ...provided, ...e })

export const useAll =
  <E1>(provided: E1) =>
  <A>(env: Env<E1, A>): Env<unknown, A> =>
  () =>
    env(provided)

export const provideAll =
  <E1>(provided: E1) =>
  <A>(env: Env<E1, A>): Env<unknown, A> =>
  (e) =>
    env({ ...provided, ...((e as any) ?? {}) })

export const UseSome: P.UseSome2<URI> = {
  useSome,
}

export const UseAll: P.UseAll2<URI> = {
  useAll,
}

export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome,
}

export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll,
}

export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...Chain })
export const useAllWith = P.useAllWith({ ...UseAll, ...Chain })
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...Chain })
export const useSomeWith = P.useSomeWith({ ...UseSome, ...Chain })

export const askAndUse = P.askAndUse({ ...UseAll, ...Chain, ...FromReader })
export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })

export const Provide: P.Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

export const Do: Env<unknown, {}> = fromIO(() => Object.create(null))
export const bindTo = bindTo_(Functor)
export const bind = FpChain.bind(Monad)
export const tupled = tupled_(Functor)

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
export const asksE: <R, E, A>(f: (r: R) => Env<E, A>) => Env<R & E, A> = flow(asks, flattenW)
export const chainReaderK = FR.chainReaderK(FromReader, Chain)
export const fromReaderK = FR.fromReaderK(FromReader)

export const chainFirstResumeK = FRe.chainFirstResumeK(FromResume, Chain)
export const chainResumeK = FRe.chainResumeK(FromResume, Chain)
export const fromResumeK = FRe.fromResumeK(FromResume)

export const chainFirstTaskK = FT.chainFirstTaskK(FromTask, Chain)
export const chainTaskK = FT.chainTaskK(FromTask, Chain)
export const fromTaskK = FT.fromTaskK(FromTask)

export const chainFirstIOK = FIO.chainFirstIOK(FromIO, Chain)
export const chainIOK = FIO.chainIOK(FromIO, Chain)
export const fromIOK = FIO.fromIOK(FromIO)

export const zip = traverse(Applicative)(<E, A>(x: Env<E, A>) => x)

export const zipW = zip as unknown as <A extends ReadonlyArray<Env<any, any>>>(
  envs: A,
) => Env<Intersect<{ [K in keyof A]: GetRequirements<A[K]> }>, { [K in keyof A]: GetValue<A[K]> }>
