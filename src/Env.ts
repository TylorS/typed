import { Alt2 } from 'fp-ts/Alt'
import { Applicative2 } from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import { bind as bind_, Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import * as FIO from 'fp-ts/FromIO'
import * as FR from 'fp-ts/FromReader'
import * as FT from 'fp-ts/FromTask'
import { constant, identity, Lazy, pipe } from 'fp-ts/function'
import { bindTo as bindTo_, Functor2, tupled as tupled_ } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'
import { traverse } from 'fp-ts/ReadonlyArray'

import * as FRe from './FromResume'
import { FromResume2 } from './FromResume'
import { Arity1 } from './function'
import { Intersect, Kind } from './Hkt'
import { MonadRec2 } from './MonadRec'
import * as P from './Provide'
import * as R from './Resume'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface Env<R, A> extends Kind<[Re.URI, R.URI], [R, A]> {}

export type GetRequirements<A> = A extends Env<infer R, any> ? R : never
export type GetValue<A> = A extends Env<any, infer R> ? R : never

export const ap: <R, A>(fa: Env<R, A>) => <B>(fab: Env<R, Arity1<A, B>>) => Env<R, B> = RT.ap(
  R.Apply,
)

export const chain = RT.chain(R.Chain) as <A, R1, B>(
  f: (a: A) => Env<R1, B>,
) => <R2>(ma: Env<R2, A>) => Env<R1 & R2, B>

export const chainFirst = <A, R, B>(f: (a: A) => Env<R, B>) => (ma: Env<R, A>): Env<R, A> =>
  pipe(
    ma,
    chain((a) =>
      pipe(
        a,
        f,
        chain(() => of(a)),
      ),
    ),
  )

export const fromReader: <R, A>(ma: Re.Reader<R, A>) => Env<R, A> = RT.fromReader(R.Pointed)

export const map: <A, B>(f: (a: A) => B) => <R>(fa: Env<R, A>) => Env<R, B> = RT.map(R.Functor)

export const of: <A, R = unknown>(a: A) => Env<R, A> = RT.of(R.Pointed)

export function chainRec<A, E, B>(f: (value: A) => Env<E, Either<A, B>>): (value: A) => Env<E, B> {
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
  export interface VarianceMap {
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

export const Apply: Ap.Apply2<URI> = {
  ...Functor,
  ap,
}

export const apS = Ap.apS(Apply)
export const apT = Ap.apT(Apply)
export const apFirst = Ap.apFirst(Apply)
export const apSecond = Ap.apSecond(Apply)

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

export const flatten = chain(identity) as <E1, E2, A>(env: Env<E1, Env<E2, A>>) => Env<E1 & E2, A>

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

export const race = <E1, A>(a: Env<E1, A>) => <E2, B>(b: Env<E2, B>): Env<E1 & E2, A | B> => (e) =>
  R.race(a(e))(b(e))

export const Alt: Alt2<URI> = {
  ...Functor,
  alt: <E, A>(snd: Lazy<Env<E, A>>) => (fst: Env<E, A>) => race(fst)(snd()),
}

export const alt = Alt.alt

export const FromIO: FIO.FromIO2<URI> = {
  URI,
  fromIO: fromReader,
}

export const fromIO = FromIO.fromIO

export const FromTask: FT.FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => R.fromTask(task),
}

export const fromTask = FromTask.fromTask

export const fromResume: <A, E = unknown>(resume: R.Resume<A>) => Env<E, A> = constant

export const FromResume: FromResume2<URI> = {
  fromResume,
}

export const useSome = <E1>(provided: E1) => <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> => (e) =>
  env({ ...e, ...provided })

export const provideSome = <E1>(provided: E1) => <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> => (e) =>
  env({ ...provided, ...e })

export const useAll = <E1>(provided: E1) => <A>(env: Env<E1, A>): Env<unknown, A> => () =>
  env(provided)

export const provideAll = <E1>(provided: E1) => <A>(env: Env<E1, A>): Env<unknown, A> => (e) =>
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
export const bind = bind_(Monad)
export const tupled = tupled_(Functor)

export const ask = FR.ask(FromReader)
export const asks = FR.asks(FromReader)
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

export const zipW = (zip as unknown) as <A extends ReadonlyArray<Env<any, any>>>(
  envs: A,
) => Env<Intersect<{ [K in keyof A]: GetRequirements<A[K]> }>, { [K in keyof A]: GetValue<A[K]> }>
