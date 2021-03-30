import { Alt2 } from 'fp-ts/Alt'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Arity1 } from './function'
import * as FR from 'fp-ts/FromReader'
import * as FRe from './FromResume'
import { bind as bind_, Chain2 } from 'fp-ts/Chain'
import { bindTo as bindTo_, Functor2, tupled as tupled_ } from 'fp-ts/Functor'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Either } from 'fp-ts/Either'
import { FromIO2 } from 'fp-ts/FromIO'
import { FromTask2 } from 'fp-ts/FromTask'
import { Kind } from './Hkt'
import { constant, Lazy } from 'fp-ts/function'
import { Monad2 } from 'fp-ts/Monad'
import { MonadRec2 } from './MonadRec'
import { Pointed2 } from 'fp-ts/Pointed'
import * as hkt from './Hkt'
import * as R from './Resume'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'
import { FromResume2 } from './FromResume'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from './Provide'

/**
 * Env is specialization of Reader<R, Resume<A>>
 */
export interface Env<R, A> extends Kind<[Re.URI, R.URI], [R, A]> {}

export const ap: <R, A>(fa: Env<R, A>) => <B>(fab: Env<R, Arity1<A, B>>) => Env<R, B> = RT.ap(
  R.Apply,
)

export const chain: <A, R, B>(f: (a: A) => Env<R, B>) => (ma: Env<R, A>) => Env<R, B> = RT.chain(
  R.Chain,
)

export const fromReader: <R, A>(ma: Re.Reader<R, A>) => Env<R, A> = RT.fromReader(R.Pointed)

export const map: <A, B>(f: (a: A) => B) => <R>(fa: Env<R, A>) => Env<R, B> = RT.map(R.Functor)

export const of: <A, R>(a: A) => Env<R, A> = RT.of(R.Pointed)

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
    [URI]: V<hkt.R, hkt.Contravariant>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
  URI,
  map,
}

export const Apply: Apply2<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative2<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain2<URI> = {
  ...Functor,
  chain,
}

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

export const FromIO: FromIO2<URI> = {
  URI,
  fromIO: fromReader,
}

export const fromIO = FromIO.fromIO

export const FromTask: FromTask2<URI> = {
  ...FromIO,
  fromTask: (task) => () => R.fromTask(task),
}

export const fromTask = FromTask.fromTask

export const FromResume: FromResume2<URI> = {
  fromResume: constant,
}

export const fromResume = FromResume.fromResume

export const useSome = <E1>(provided: E1) => <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> => (e) =>
  env({ ...e, ...provided })

export const provideSome = <E1>(provided: E1) => <E2, A>(env: Env<E1 & E2, A>): Env<E2, A> => (e) =>
  env({ ...provided, ...e })

export const useAll = <E1>(provided: E1) => <A>(env: Env<E1, A>): Env<never, A> => () =>
  env(provided)

export const provideAll = <E1>(provided: E1) => <A>(env: Env<E1, A>): Env<never, A> => (e) =>
  env({ ...provided, ...((e as any) ?? {}) })

export const UseSome: UseSome2<URI> = {
  useSome,
}

export const UseAll: UseAll2<URI> = {
  useAll,
}

export const ProvideSome: ProvideSome2<URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll2<URI> = {
  provideAll,
}

export const Provide: Provide2<URI> = {
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
