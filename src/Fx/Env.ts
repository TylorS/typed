import { flow } from '@fp/function'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import * as IO from 'fp-ts/IO'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as R from 'fp-ts/Reader'
import * as T from 'fp-ts/Task'

import * as E from '../Env'
import * as FxT from '../FxT'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '../Provide'
import * as Re from '../Resume'
import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doEnv = FxT.getDo<E.URI>()
export const liftEnv = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toEnv = FxT.toMonad<E.URI>(E.MonadRec) as <Y extends E.Env<any, any>, R>(
  fx: Fx<Y, R, unknown>,
) => [Y] extends [E.Env<infer E, any>] ? E.Env<E, R> : never
export const Do = flow(doEnv, toEnv)

export const useSome = FxT.useSome({ ...E.UseSome, ...E.MonadRec })
export const useAll = FxT.useAll({ ...E.UseAll, ...E.MonadRec })
export const provideSome = FxT.provideSome({ ...E.ProvideSome, ...E.MonadRec })
export const provideAll = FxT.provideAll({ ...E.ProvideAll, ...E.MonadRec })
export const fromIO = FxT.fromNaturalTransformation<IO.URI, E.URI>(E.fromIO)
export const fromResume = FxT.fromNaturalTransformation<Re.URI, E.URI>(E.fromResume)
export const fromTask = FxT.fromNaturalTransformation<T.URI, E.URI>(E.fromTask)
export const asks = FxT.fromNaturalTransformation<R.URI, E.URI>(E.fromReader)
export const ask = FxT.ask(E.FromReader)

export const URI = '@typed/fp/Fx/Env'
export type URI = typeof URI

export interface FxEnv<E, A> extends Fx<E.Env<E, unknown>, A> {}

export type GetRequirements<A> = A extends (...args: readonly any[]) => any
  ? GetRequirements<ReturnType<A>>
  : A extends FxEnv<infer E, any>
  ? E
  : never

export type GetValue<A> = A extends (...args: readonly any[]) => any
  ? GetValue<ReturnType<A>>
  : A extends FxEnv<any, infer R>
  ? R
  : never

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxEnv<E, A>
  }
}

export const Pointed: Pointed2<URI> = {
  of,
}

export const Functor: Functor2<URI> = {
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
  chainRec,
}

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
