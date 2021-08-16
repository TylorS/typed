/**
 * ReaderStream is a ReaderT of Most.js' Stream.
 * @since 0.9.2
 */
import { SeedValue as SV } from '@most/core/dist/combinator/loop'
import * as H from '@most/hold'
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Compactable2 } from 'fp-ts/Compactable'
import { Either, isLeft, isRight } from 'fp-ts/Either'
import { Eq } from 'fp-ts/Eq'
import * as Filterable_ from 'fp-ts/Filterable'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import { pipe } from 'fp-ts/function'
import * as F from 'fp-ts/Functor'
import { IO } from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import { not, Predicate } from 'fp-ts/Predicate'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'
import * as RA from 'fp-ts/ReadonlyArray'
import { Refinement } from 'fp-ts/Refinement'
import { Separated } from 'fp-ts/Separated'
import { Task } from 'fp-ts/Task'

import { settable } from './Disposable'
import * as E from './Env'
import { deepEqualsEq } from './Eq'
import * as FE from './FromEnv'
import * as FRe from './FromResume'
import * as FS from './FromStream'
import * as FN from './function'
import { Intersect } from './HKT'
import { MonadRec2 } from './MonadRec'
import * as O from './Option'
import * as P from './Provide'
import { async } from './Resume'
import { SchedulerEnv } from './Scheduler'
import * as S from './Stream'
import * as St from './struct'

/**
 * Env is specialization of Reader<R, Resume<A>>
 * @since 0.9.2
 * @category Model
 */
export interface ReaderStream<R, A> extends Re.Reader<R, S.Stream<A>> {}

/**
 * @since 0.9.2
 * @category Type-level
 */
export type RequirementsOf<A> = [A] extends [ReaderStream<infer R, any>] ? R : never
/**
 * @since 0.9.2
 * @category Type-level
 */
export type ValueOf<A> = [A] extends [ReaderStream<any, infer R>] ? R : never

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = RT.ap(S.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apW = ap as <R1, A>(
  fa: ReaderStream<R1, A>,
) => <R2, B>(fab: ReaderStream<R2, FN.Arity1<A, B>>) => ReaderStream<R1 & R2, B>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = RT.chain(S.Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainW = chain as <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>,
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const switchMap = RT.chain<S.URI>({
  map: S.map,
  chain: (f) => FN.flow(S.map(f), S.switchLatest),
})
/**
 * @since 0.9.2
 * @category Combinator
 */
export const switchMapW = switchMap as <A, R1, B>(
  f: (a: A) => ReaderStream<R1, B>,
) => <R2>(ma: ReaderStream<R2, A>) => ReaderStream<R1 & R2, B>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const switchFirst =
  <R1, A>(second: ReaderStream<R1, A>) =>
  <R2, B>(first: ReaderStream<R2, B>): ReaderStream<R1 & R2, B> =>
  (r) =>
    pipe(first, withStream(S.switchFirst(second(r))))(r)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReader: <R, A>(ma: Re.Reader<R, A>) => ReaderStream<R, A> = RT.fromReader(
  S.Pointed,
)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map: <A, B>(f: (a: A) => B) => <R>(fa: ReaderStream<R, A>) => ReaderStream<R, B> =
  RT.map(S.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const constant = <B>(b: B) => map(() => b)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const of: <A, R = unknown>(a: A) => ReaderStream<R, A> = RT.of(S.Pointed)

/**
 * @since 0.9.2
 * @category Combinator
 */
export function chainRec<A, E, B>(
  f: (value: A) => ReaderStream<E, Either<A, B>>,
): (value: A) => ReaderStream<E, B> {
  return (value) => (env) => S.chainRec((a: A) => f(a)(env))(value)
}

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/ReaderStream'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: ReaderStream<E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<E, Contravariant>
  }
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: Pointed2<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: F.Functor2<URI> = {
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
export const Apply: Ap.Apply2<URI> = {
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
export const apFirstW = apFirst as <E1, B>(
  second: ReaderStream<E1, B>,
) => <E2, A>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apS = Ap.apS(Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSW = apS as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: ReaderStream<E1, B>,
) => <E2>(
  fa: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSecond = Ap.apSecond(Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSecondW = apSecond as <E1, B>(
  second: ReaderStream<E1, B>,
) => <E2, A>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, B>
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apT = Ap.apT(Apply)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const apTW = apT as <E1, B>(
  fb: ReaderStream<E1, B>,
) => <E2, A extends readonly unknown[]>(
  fas: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, readonly [...A, B]>
/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSEnv: <N extends string, A, E, B>(
  name: Exclude<N, keyof A>,
  fb: E.Env<E, B>,
) => (
  fa: ReaderStream<E, A>,
) => ReaderStream<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = (name, fb) =>
  apS(name, FN.pipe(fb, fromEnv))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSEnvW = apSEnv as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: E.Env<E1, B>,
) => <E2>(
  fa: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apTEnvW: <E1, B>(
  fb: E.Env<E1, B>,
) => <E2, A extends readonly unknown[]>(
  fas: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, readonly [...A, B]> = (fb) => FN.pipe(fb, fromEnv, apTW)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apTEnv: <E, B>(
  fb: E.Env<E, B>,
) => <A extends readonly unknown[]>(
  fas: ReaderStream<E, A>,
) => ReaderStream<E, readonly [...A, B]> = apTEnvW

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: App.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Ch.Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirst = Ch.chainFirst(Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstW = chainFirst as <A, E1, B>(
  f: (a: A) => ReaderStream<E1, B>,
) => <E2>(first: ReaderStream<E2, A>) => ReaderStream<E1 & E2, A>
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bind = Ch.bind(Chain)
/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindW = bind as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderStream<E1, B>,
) => <E2>(
  ma: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindEnv: <N extends string, A, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => E.Env<E, B>,
) => (
  ma: ReaderStream<E, A>,
) => ReaderStream<E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = (name, f) =>
  bind(name, FN.flow(f, fromEnv))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindEnvW: <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => E.Env<E1, B>,
) => <E2>(
  ma: ReaderStream<E2, A>,
) => ReaderStream<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = (
  name,
  f,
) => bindW(name, FN.flow(f, fromEnv))

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad2<URI> = {
  ...Chain,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  chainRec,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromReader: FR.FromReader2<URI> = {
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
export const FromResume: FRe.FromResume2<URI> = {
  fromResume: (r) => () => S.fromResume(r),
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
export const FromEnv: FE.FromEnv2<URI> = {
  fromEnv: (env) => FN.flow(env, S.fromResume),
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
 * @category Instance
 */
export const FromIO: FIO.FromIO2<URI> = {
  fromIO: (io) => () => S.fromIO(io),
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
 * @category Constructor
 */
export const Do = fromIO((): {} => Object.create(null))

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FT.FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => S.fromTask(task),
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
export const FromStream: FS.FromStream2<URI> = {
  fromStream: FN.constant,
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
 * @category Constructor
 */
export const asksEnv =
  <E1, E2, B>(f: (e1: E1) => E.Env<E2, B>): ReaderStream<E1 & E2, B> =>
  (r) =>
    FN.pipe(r, f(r), S.fromResume)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const asksIO =
  <E1, B>(f: (e1: E1) => IO<B>): ReaderStream<E1, B> =>
  (r) =>
    FN.pipe(r, f, S.fromIO)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const asksTask =
  <E1, B>(f: (e1: E1) => Task<B>): ReaderStream<E1, B> =>
  (r) =>
    FN.pipe(r, f, S.fromTask)

/**
 * @since 0.9.2
 * @category Combinator
 */
export function filter<A, B extends A>(
  refinement: Refinement<A, B>,
): <E>(rs: ReaderStream<E, A>) => ReaderStream<E, B>
export function filter<A>(
  predicate: Predicate<A>,
): <E>(rs: ReaderStream<E, A>) => ReaderStream<E, A>
export function filter<A>(predicate: Predicate<A>) {
  return <E>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
    (r) =>
      FN.pipe(r, rs, S.filter(predicate))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function merge<E1, A>(a: ReaderStream<E1, A>) {
  return <E2, B>(b: ReaderStream<E2, B>): ReaderStream<E1 & E2, A | B> =>
    (r) =>
      FN.pipe(a(r), S.merge(b(r)))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function mergeFirst<E1, A>(a: ReaderStream<E1, A>) {
  return <E2, B>(b: ReaderStream<E2, B>): ReaderStream<E1 & E2, B> =>
    (r) =>
      FN.pipe(r, b, S.mergeFirst(a(r)))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function mergeArray<A extends ReadonlyArray<ReaderStream<any, any>>>(
  streams: A,
): ReaderStream<Intersect<{ readonly [K in keyof A]: RequirementsOf<A[K]> }>, ValueOf<A[number]>> {
  return (r) => S.mergeArray(streams.map((rs) => rs(r)))
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export function concatMap<A, E1>(f: (value: A) => ReaderStream<E1, A>) {
  return <E2>(rs: ReaderStream<E2, A>): ReaderStream<E1 & E2, A> =>
    (r) =>
      FN.pipe(
        r,
        rs,
        S.concatMap((a) => FN.pipe(r, f(a))),
      )
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const recoverWith =
  <E1, A>(f: (error: Error) => ReaderStream<E1, A>) =>
  <E2>(rs: ReaderStream<E2, A>): ReaderStream<E1 & E2, A> =>
  (r) =>
    FN.pipe(
      r,
      rs,
      S.recoverWith((e) => FN.pipe(r, f(e))),
    )

/**
 * @since 0.9.2
 * @category Constructor
 */
export const empty = fromStreamK(S.empty)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const never = fromStreamK(S.never)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const periodic = fromStreamK(S.periodic)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(rs: ReaderStream<E1 & E2, A>): ReaderStream<E2, A> =>
  (e2) =>
    rs({ ...provided, ...e2 })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(rs: ReaderStream<E1 & E2, A>): ReaderStream<E2, A> =>
  (e2) =>
    rs({ ...e2, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <E1>(provided: E1) =>
  <A>(rs: ReaderStream<E1, A>): ReaderStream<unknown, A> =>
  (e2) =>
    rs({ ...provided, ...(e2 as any) })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <E1>(provided: E1) =>
  <A>(rs: ReaderStream<E1, A>): ReaderStream<unknown, A> =>
  () =>
    rs(provided)

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideSome: P.ProvideSome2<URI> = {
  provideSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseSome: P.UseSome2<URI> = {
  useSome,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const UseAll: P.UseAll2<URI> = {
  useAll,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide2<URI> = {
  provideAll,
  provideSome,
  useAll,
  useSome,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndUse = P.askAndUse({ ...UseAll, ...Chain, ...FromReader })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAllWith = P.useAllWith({ ...UseAll, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSomeWith = P.useSomeWith({ ...UseSome, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSomeWithEnv = FE.provideSomeWithEnv({ ...FromEnv, ...ProvideSome, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAllWithEnv = FE.provideAllWithEnv({ ...FromEnv, ...ProvideAll, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSomeWithEnv = FE.useSomeWithEnv({ ...FromEnv, ...UseSome, ...Chain })
/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAllWithEnv = FE.useAllWithEnv({ ...FromEnv, ...UseAll, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const combine =
  <A, B, C>(f: (a: A, b: B) => C) =>
  <E1>(rsa: ReaderStream<E1, A>) =>
  <E2>(rsb: ReaderStream<E2, B>): ReaderStream<E1 & E2, C> =>
  (e) =>
    S.combine(f, rsa(e), rsb(e))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const combineAll =
  <A extends readonly ReaderStream<any, any>[]>(
    ...rss: A
  ): ReaderStream<
    Intersect<{ readonly [K in keyof A]: RequirementsOf<A[K]> }>,
    { readonly [K in keyof A]: ValueOf<A[K]> }
  > =>
  (e) =>
    S.combineAll(...rss.map((rs) => rs(e)))

/**
 * @since 0.13.2
 * @category Combinator
 */
export const struct = <Props extends Readonly<Record<string, ReaderStream<any, any>>>>(
  props: Props,
) =>
  pipe(
    combineAll(
      ...pipe(
        Object.entries(props),
        RA.map(([k, stream]) =>
          pipe(
            stream,
            map((v) => St.make(k, v)),
          ),
        ),
      ),
    ),
    map((o) => Object.assign({}, ...o) as { readonly [K in keyof Props]: ValueOf<Props[K]> }),
  )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const withStream =
  <A, B>(f: (stream: S.Stream<A>) => B) =>
  <E>(rs: ReaderStream<E, A>): Re.Reader<E, B> =>
  (e) =>
    FN.pipe(e, rs, f)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const tap =
  <A>(f: (value: A) => any) =>
  <E>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(rs, withStream(S.tap(f)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const take: (n: number) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A> = FN.flow(
  S.take,
  withStream,
)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const skip: (n: number) => <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A> = FN.flow(
  S.skip,
  withStream,
)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const startWith =
  <A>(value: A) =>
  <E, B>(stream: ReaderStream<E, B>): ReaderStream<E, A | B> =>
    withStream(S.startWith<A | B>(value))(stream)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const exhaustLatest =
  <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>): ReaderStream<E1 & E2, A> =>
  (e) =>
    S.exhaustMapLatest((rs: ReaderStream<E2, A>) => rs(e))(rs(e))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const exhaustMapLatest =
  <A, E1, B>(f: (value: A) => ReaderStream<E1, B>) =>
  <E2>(rs: ReaderStream<E2, A>): ReaderStream<E1 & E2, B> =>
  (e) =>
    S.exhaustMapLatest((a: A) => f(a)(e))(rs(e))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const exhaustLatestEnv =
  <E1, A>(env: E.Env<E1, A>) =>
  <E2, B>(rs: ReaderStream<E2, B>): ReaderStream<E1 & E2, A> =>
    exhaustMapLatest(() => fromEnv(env))(rs)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const exhaustMapLatestEnv =
  <A, E1, B>(f: (value: A) => E.Env<E1, B>) =>
  <E2>(rs: ReaderStream<E2, A>): ReaderStream<E1 & E2, B> =>
    exhaustMapLatest((a: A) => fromEnv(f(a)))(rs)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const onDispose = (
  disposable: S.Disposable,
): (<E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A>) => withStream(S.onDispose(disposable))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const collectEvents =
  (scheduler: S.Scheduler) =>
  <E, A>(rs: ReaderStream<E, A>): Re.Reader<E, Promise<readonly A[]>> =>
    FN.pipe(rs, withStream(S.collectEvents(scheduler)))

/**
 * @since 0.9.2
 * @category Constructor
 */
export const now = FN.flow(S.now, fromStream)
/**
 * @since 0.9.2
 * @category Constructor
 */
export const at = FN.flow(S.at, fromStream)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const scan =
  <A, B>(f: (acc: A, value: B) => A, seed: A) =>
  <E>(rs: ReaderStream<E, B>): ReaderStream<E, A> =>
    FN.pipe(rs, withStream(S.scan(f, seed)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const skipRepeatsWith =
  <A>(Eq: Eq<A>) =>
  <E>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(rs, withStream(S.skipRepeatsWith((a, b) => Eq.equals(a)(b))))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const skipRepeats: <E, A>(rs: ReaderStream<E, A>) => ReaderStream<E, A> =
  skipRepeatsWith(deepEqualsEq)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const compact: <E, A>(rs: ReaderStream<E, O.Option<A>>) => ReaderStream<E, A> = withStream(
  S.compact,
)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const continueWith =
  <E1, A>(f: () => ReaderStream<E1, A>) =>
  <E2, B>(rs: ReaderStream<E2, A>): ReaderStream<E1 & E2, A | B> =>
  (e) =>
    FN.pipe(
      e,
      rs,
      S.continueWith(() => f()(e)),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const debounce =
  (delay: S.Time) =>
  <E, A>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(rs, withStream(S.debounce(delay)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const delay =
  (delay: S.Time) =>
  <E, A>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(rs, withStream(S.delay(delay)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const join =
  <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>): ReaderStream<E1 & E2, A> =>
  (e) =>
    FN.pipe(
      e,
      rs,
      S.chain((f) => f(e)),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const during =
  <E1, E2>(timeWindow: ReaderStream<E1, ReaderStream<E2, any>>) =>
  <E3, A>(values: ReaderStream<E3, A>): ReaderStream<E1 & E2 & E3, A> =>
  (e) =>
    FN.pipe(e, values, S.during<A>(join(timeWindow)(e)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const filterMap =
  <A, B>(f: (a: A) => O.Option<B>) =>
  <E>(fa: ReaderStream<E, A>): ReaderStream<E, B> =>
    FN.pipe(fa, withStream(S.filterMap(f)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const loop =
  <A, B, C>(f: (a: A, b: B) => SV<A, C>, seed: A) =>
  <E>(fa: ReaderStream<E, B>): ReaderStream<E, C> =>
  (e) =>
    FN.pipe(e, fa, S.loop(f, seed))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const mergeConcurrently =
  (concurrency: number) =>
  <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>): ReaderStream<E1 & E2, A> =>
  (e) =>
    FN.pipe(
      e,
      rs,
      S.mergeMapConcurrently((rs) => rs(e), concurrency),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const multicast = <E, A>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
  FN.pipe(rs, withStream(S.multicast))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const partition =
  <A>(predicate: Predicate<A>) =>
  <E>(fa: ReaderStream<E, A>): Separated<ReaderStream<E, A>, ReaderStream<E, A>> => ({
    left: FN.pipe(fa, filter(not(predicate))),
    right: FN.pipe(fa, filter(predicate)),
  })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const partitionMap =
  <A, B, C>(f: (a: A) => Either<B, C>) =>
  <E>(fa: ReaderStream<E, A>): Separated<ReaderStream<E, B>, ReaderStream<E, C>> => ({
    left: FN.pipe(
      fa,
      map(f),
      filter(isLeft),
      map((x) => x.left),
    ),
    right: FN.pipe(
      fa,
      map(f),
      filter(isRight),
      map((x) => x.right),
    ),
  })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const race =
  <E1, A>(second: ReaderStream<E1, A>) =>
  <E2, B>(first: ReaderStream<E2, B>): ReaderStream<E1 & E2, A | B> =>
  (e) =>
    FN.pipe(
      e,
      first,
      S.race<A | B>(() => second(e)),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const separate = <E, A, B>(rs: ReaderStream<E, Either<A, B>>) =>
  FN.pipe(
    rs,
    partitionMap((e) => e),
  )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const since =
  <E1>(timeWindow: ReaderStream<E1, any>) =>
  <E2, A>(values: ReaderStream<E2, A>): ReaderStream<E1 & E2, A> =>
  (e) =>
    FN.pipe(e, values, S.since<A>(timeWindow(e)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const skipAfter =
  <A>(p: (a: A) => boolean) =>
  <E>(s: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(s, withStream(S.skipAfter(p)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const skipWhile =
  <A>(p: (a: A) => boolean) =>
  <E>(s: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(s, withStream(S.skipWhile(p)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const slice =
  (skip: number, take: number) =>
  <E, A>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(rs, withStream(S.slice(skip, take)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const switchLatest =
  <E1, E2, A>(rs: ReaderStream<E1, ReaderStream<E2, A>>): ReaderStream<E1 & E2, A> =>
  (e) =>
    FN.pipe(
      e,
      rs,
      S.map((f) => f(e)),
      S.switchLatest,
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const takeWhile =
  <A>(p: (a: A) => boolean) =>
  <E>(s: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(s, withStream(S.takeWhile(p)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const throttle =
  (period: number) =>
  <E, A>(s: ReaderStream<E, A>): ReaderStream<E, A> =>
    FN.pipe(s, withStream(S.throttle(period)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const throwError = fromStreamK(S.throwError)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const until =
  <E1>(timeWindow: ReaderStream<E1, any>) =>
  <E2, A>(values: ReaderStream<E2, A>): ReaderStream<E1 & E2, A> =>
  (e) =>
    FN.pipe(e, values, S.until<A>(timeWindow(e)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const zero = FN.flow(S.zero, fromStream)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Filterable: Filterable_.Filterable2<URI> = {
  partitionMap,
  partition,
  filterMap,
  filter,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Compactable: Compactable2<URI> = {
  compact,
  separate,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const keyed =
  <A>(Eq: Eq<A>) =>
  <E>(rs: ReaderStream<E, readonly A[]>): ReaderStream<E, readonly S.Stream<A>[]> =>
    pipe(rs, withStream(S.keyed(Eq)))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const mergeMapWhen =
  <V>(Eq: Eq<V> = deepEqualsEq) =>
  <E1, A>(f: (value: V) => ReaderStream<E1, A>) =>
  <E2>(values: ReaderStream<E2, ReadonlyArray<V>>): ReaderStream<E1 & E2, ReadonlyArray<A>> =>
  (e) =>
    pipe(values, withStream(S.mergeMapWhen(Eq)((v) => f(v)(e))))(e)

/**
 * Listens to the next value of a stream.
 */
/**
 * @since 0.9.2
 * @category Natural Transformation
 */
export const toEnv =
  <E, A>(rs: ReaderStream<E, A>): E.Env<E & SchedulerEnv, A> =>
  (e) =>
    async((resume) => {
      const disposable = settable()

      disposable.addDisposable(
        pipe(e, rs, S.take(1)).run(
          S.createSink({ event: (_, x) => disposable.addDisposable(resume(x)) }),
          e.scheduler,
        ),
      )

      return disposable
    })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const hold = <E, A>(rs: ReaderStream<E, A>): ReaderStream<E, A> =>
  pipe(rs, withStream(H.hold))
