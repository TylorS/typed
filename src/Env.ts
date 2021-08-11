/**
 * Env is a ReaderT of Resume. Capable of utilizing Dependency Injection from Reader,
 * and execute Synchronous and Asynchronous operations with the same effect. This
 * is the basis of many of the higher-level APIs like Ref.
 *
 * `Env` is the core of the higher-level modules like [Ref](./Ref.ts.md) and is a `ReaderT` of [Resume](./Resume.ts.md); but
 * to be honest, being used so much, I didn't like writing `ReaderResume<E, A>` and chose to shorten to
 * `Env<E, A>` for the "environmental" quality Reader provides. Combining Reader and Resume allows for
 * creating APIs capable of utilizing dependency injection for their configuration and testability
 * while still combining your sync/async workflows.
 *
 * While designing application APIs it is often better to describe the logic of your system separate
 * from the implementation details. `Env` or rather `Reader` helps you accomplish this through the
 * [Dependency Inversion Principle](https://alexnault.dev/dependency-inversion-principle-in-functional-typescript).
 * This principle is one of the easiest ways to begin improving any codebase.
 *
 * @since 0.9.2
 */
import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import * as Alt_ from 'fp-ts/Alt'
import * as FpApplicative from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as FpChain from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import * as FN from 'fp-ts/function'
import { bindTo as bindTo_, flap as flap_, Functor2, tupled as tupled_ } from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'
import * as RA from 'fp-ts/ReadonlyArray'
import { traverse } from 'fp-ts/ReadonlyArray'
import * as Task from 'fp-ts/Task'

import * as FRe from './FromResume'
import { FromResume2 } from './FromResume'
import { ArgsOf, Arity1 } from './function'
import { Intersect } from './HKT'
import { MonadRec2 } from './MonadRec'
import * as P from './Provide'
import * as R from './Resume'
import * as St from './struct'

/**
 * Env is specialization of Reader<R, Resume<A>>
 * @since 0.9.2
 * @category Model
 */
export interface Env<R, A> extends Re.Reader<R, R.Resume<A>> {}

/**
 * @since 0.9.2
 * @category Type-level
 */
export type RequirementsOf<A> = [A] extends [Env<infer R, any>]
  ? R
  : [A] extends [FN.FunctionN<any, Env<infer R, any>>]
  ? R
  : never

/**
 * @since 0.9.2
 * @category Type-level
 */
export type ValueOf<A> = A extends Env<any, infer R>
  ? R
  : A extends FN.FunctionN<any, Env<any, infer R>>
  ? R
  : never

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap: <R, A>(fa: Env<R, A>) => <B>(fab: Env<R, Arity1<A, B>>) => Env<R, B> = RT.ap(
  R.Apply,
)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apW = RT.ap(R.Apply) as <R1, A>(
  fa: Env<R1, A>,
) => <R2, B>(fab: Env<R2, Arity1<A, B>>) => Env<R1 & R2, B>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = RT.chain(R.Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainW = RT.chain(R.Chain) as <A, R1, B>(
  f: (a: A) => Env<R1, B>,
) => <R2>(ma: Env<R2, A>) => Env<R1 & R2, B>

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromReader: <R, A>(ma: Re.Reader<R, A>) => Env<R, A> = RT.fromReader(R.Pointed)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map: <A, B>(f: (a: A) => B) => <R>(fa: Env<R, A>) => Env<R, B> = RT.map(R.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const tap =
  <A>(f: (a: A) => any) =>
  <R>(fa: Env<R, A>): Env<R, A> =>
    FN.pipe(
      fa,
      map((a) => {
        f(a)

        return a
      }),
    )

/**
 * @since 0.9.2
 * @category Combinator
 */
export const constant = FN.flow(FN.constant, map)

/**
 * @since 0.9.2
 * @category Model
 */
export type Of<A> = Env<unknown, A>

/**
 * @since 0.9.2
 * @category Constructor
 */
export const of: <A>(a: A) => Of<A> = RT.of(R.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const asksIOK: <R, A>(f: (r: R) => IO.IO<A>) => Env<R, A> = RT.fromNaturalTransformation<
  IO.URI,
  R.URI
>(R.fromIO)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const asksTaskK: <R, A>(f: (r: R) => Task.Task<A>) => Env<R, A> =
  RT.fromNaturalTransformation<Task.URI, R.URI>(R.fromTask)

/**
 * @since 0.9.2
 * @category Combinator
 */
export function chainRec<F extends (value: any) => Env<any, E.Either<any, any>>>(
  f: F,
): (
  value: ArgsOf<F>[0],
) => Env<
  RequirementsOf<ReturnType<F>>,
  [ValueOf<ReturnType<F>>] extends [E.Either<any, infer R>] ? R : never
> {
  return (value) => (env) =>
    R.chainRec((a: [ValueOf<ReturnType<F>>] extends [E.Either<any, infer R>] ? R : never) =>
      f(a)(env),
    )(value)
}

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/Env'
/**
 * @since 0.9.2
 * @category URI
 */
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: Env<E, A>
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
export const Functor: Functor2<URI> = {
  URI,
  map,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const flap = flap_(Functor)

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
export const apS = Ap.apS(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSW = apS as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  fb: Env<E1, B>,
) => <E2>(
  fa: Env<E2, A>,
) => Env<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

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
  fb: Env<E1, B>,
) => <E2, A extends readonly unknown[]>(fas: Env<E2, A>) => Env<E1 & E2, readonly [...A, B]>

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
  second: Env<E1, B>,
) => <E2, A>(first: Env<E2, A>) => Env<E1 & E2, A>

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
  second: Env<E1, B>,
) => <E2, A>(first: Env<E2, A>) => Env<E1 & E2, B>

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getSemigroup = Ap.getApplySemigroup(Apply)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: FpApplicative.Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getMonoid = FpApplicative.getApplicativeMonoid(Applicative)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: FpChain.Chain2<URI> = {
  ...Functor,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirst = FpChain.chainFirst(Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirstW = chainFirst as <A, E1, B>(
  f: (a: A) => Env<E1, B>,
) => <E2>(first: Env<E2, A>) => Env<E1 & E2, A>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const flattenW = chain(FN.identity) as <E1, E2, A>(
  env: Env<E1, Env<E2, A>>,
) => Env<E1 & E2, A>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const flatten = chain(FN.identity) as <E, A>(env: Env<E, Env<E, A>>) => Env<E, A>

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
  URI,
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
  fromReader: (reader) => (e) => R.sync(() => reader(e)),
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const raceW =
  <E1, A>(a: Env<E1, A>) =>
  <E2, B>(b: Env<E2, B>): Env<E1 & E2, A | B> =>
  (e) =>
    R.race(a(e))(b(e))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const race =
  <E, A>(a: Env<E, A>) =>
  <B>(b: Env<E, B>): Env<E, A | B> =>
  (e) =>
    R.race(a(e))(b(e))

/**
 * @since 0.9.2
 * @category Instance
 */
export const Alt: Alt_.Alt2<URI> = {
  ...Functor,
  alt:
    <E, A>(snd: FN.Lazy<Env<E, A>>) =>
    (fst: Env<E, A>) =>
      raceW(fst)(snd()),
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = Alt.alt

/**
 * @since 0.9.2
 * @category Combinator
 */
export const altW = alt as <E1, A>(
  snd: FN.Lazy<Env<E1, A>>,
) => <E2>(fst: Env<E2, A>) => Env<E1 & E2, A>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const altAll = Alt_.altAll(Alt)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromIO = fromReader as <A>(fa: IO.IO<A>) => Env<unknown, A>

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromIO: FIO.FromIO2<URI> = {
  URI,
  fromIO,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const FromTask: FT.FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => R.fromTask(task),
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromTask = FromTask.fromTask as <A, E = unknown>(fa: Task.Task<A>) => Env<E, A>

/**
 * @since 0.9.2
 * @category Constructor
 */
export const fromResume: <A, E = unknown>(resume: R.Resume<A>) => Env<E, A> = FN.constant

/**
 * @since 0.9.2
 * @category Combinator
 */
export const FromResume: FromResume2<URI> = {
  fromResume,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSome =
  <E1>(provided: E1) =>
  <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> =>
  (e) =>
    env({ ...e, ...provided })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSome =
  <E1>(provided: E1) =>
  <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> =>
  (e) =>
    env({ ...provided, ...e })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAll =
  <E1>(provided: E1) =>
  <A>(env: Env<E1, A>): Env<unknown, A> =>
  () =>
    env(provided)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAll =
  <E1>(provided: E1) =>
  <A>(env: Env<E1, A>): Env<unknown, A> =>
  (e) =>
    env({ ...provided, ...((e as any) ?? {}) })

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
export const UseAll: P.UseAll2<URI> = {
  useAll,
}

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
export const ProvideAll: P.ProvideAll2<URI> = {
  provideAll,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideAllWith = P.provideAllWith({ ...ProvideAll, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useAllWith = P.useAllWith({ ...UseAll, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const provideSomeWith = P.provideSomeWith({ ...ProvideSome, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const useSomeWith = P.useSomeWith({ ...UseSome, ...Chain })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndUse = P.askAndUse({ ...UseAll, ...Chain, ...FromReader })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const askAndProvide = P.askAndProvide({ ...ProvideAll, ...Chain, ...FromReader })

/**
 * @since 0.9.2
 * @category Combinator
 */
export const toResume = FN.flow(
  askAndUse,
  map((e) => e({})),
)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Provide: P.Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}

/**
 * @since 0.9.2
 * @category Constructor
 */
export const Do: Env<unknown, {}> = fromIO(() => Object.create(null))

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindTo = bindTo_(Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bind = FpChain.bind(Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindW = FpChain.bind(Monad) as <N extends string, A, E1, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Env<E1, B>,
) => <E2>(
  ma: Env<E2, A>,
) => Env<E1 & E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const tupled = tupled_(Functor)

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
 * @category Constructor
 */
export const asksE: <R, E, A>(f: (r: R) => Env<E, A>) => Env<E & R, A> = FN.flow(asks, flattenW)

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
 * @category Combinator
 */
export const zip = traverse(Applicative)(<E, A>(x: Env<E, A>) => x)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const zipW = zip as unknown as <A extends ReadonlyArray<Env<any, any>>>(
  envs: A,
) => Env<Intersect<{ [K in keyof A]: RequirementsOf<A[K]> }>, { [K in keyof A]: ValueOf<A[K]> }>

/**
 * @since 0.9.2
 * @category Combinator
 */
export const combineAll = <A extends ReadonlyArray<Env<any, any>>>(...envs: A) => zipW(envs)

/**
 * @since 0.11.0
 * @category Combinator
 */
export const combineStruct = <Props extends Readonly<Record<string, Env<any, any>>>>(
  props: Props,
) =>
  FN.pipe(
    combineAll(
      ...FN.pipe(
        Object.entries(props),
        RA.map(([k, env]) =>
          FN.pipe(
            env,
            map((v) => St.make(k, v)),
          ),
        ),
      ),
    ),
    map((o) => Object.assign({}, ...o) as { readonly [K in keyof Props]: ValueOf<Props[K]> }),
  )
/**
 * @since 0.9.2
 * @category Execution
 */
export const runWith =
  <A>(f: (value: A) => Disposable) =>
  <E>(requirements: E) =>
  (env: Env<E, A>): Disposable =>
    FN.pipe(requirements, env, R.run(f))

/**
 * @since 0.9.2
 * @category Execution
 */
export const execWith = runWith<any>(disposeNone)

/**
 * Construct an Env to a lazily-defined Env-based effect that must be provided later.
 * Does not support functions which require type-parameters as they will resolve to unknown, due
 * to limitations in TS, if you need this maybe use [asksE](#askse)
 * @since 0.9.2
 * @category Constructor
 */
export const op =
  <F extends (...args: readonly any[]) => Env<any, any>>() =>
  <K extends PropertyKey>(
    key: K,
  ): {
    (...args: ArgsOf<F>): Env<
      RequirementsOf<ReturnType<F>> & { readonly [_ in K]: F },
      ValueOf<ReturnType<F>>
    >
    readonly key: K
  } => {
    function operation(
      ...args: ArgsOf<F>
    ): Env<RequirementsOf<ReturnType<F>> & { readonly [_ in K]: F }, ValueOf<ReturnType<F>>> {
      return FN.pipe(
        ask<{ readonly [_ in K]: F }>(),
        chain((e) => e[key](...args)),
      )
    }

    operation.key = key

    return operation
  }

/**
 * @since 0.9.2
 * @category Combinator
 */
export const toResumeK = <Args extends readonly any[], E, A>(envK: (...args: Args) => Env<E, A>) =>
  FN.pipe(
    ask<E>(),
    map(
      (e) =>
        (...args: Args) =>
          FN.pipe(e, envK(...args)),
    ),
  )
