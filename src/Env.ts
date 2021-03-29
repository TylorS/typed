import { Either } from 'fp-ts/Either'
import { Arity1 } from './function'
import { Kind } from './Hkt'
import * as R from './Resume'
import * as Re from 'fp-ts/Reader'
import * as RT from 'fp-ts/ReaderT'

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

import { Alt2 } from 'fp-ts/Alt'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { bind as bind_, Chain2 } from 'fp-ts/Chain'
import { bindTo as bindTo_, Functor2, tupled as tupled_ } from 'fp-ts/Functor'
import { FromIO2 } from 'fp-ts/FromIO'
import { FromTask2 } from 'fp-ts/FromTask'
import { Lazy } from 'fp-ts/function'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as hkt from './Hkt'
import { MonadRec2 } from './MonadRec'

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

export const Do: Env<unknown, {}> = fromIO(() => Object.create(null))
export const bindTo = bindTo_(Functor)
export const bind = bind_(Monad)
export const tupled = tupled_(Functor)
