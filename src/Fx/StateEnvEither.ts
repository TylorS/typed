import { Provide4, ProvideAll4, ProvideSome4, UseAll4, UseSome4 } from '@fp/Provide'
import { Applicative4 } from 'fp-ts/Applicative'
import { Apply4 } from 'fp-ts/Apply'
import { Chain4 } from 'fp-ts/Chain'
import { ChainRec4 } from 'fp-ts/ChainRec'
import { flow } from 'fp-ts/function'
import { Functor4 } from 'fp-ts/Functor'
import { Monad4 } from 'fp-ts/Monad'
import { Pointed4 } from 'fp-ts/Pointed'
import * as R from 'fp-ts/Reader'

import * as FxT from '../FxT'
import * as SEE from '../StateEnvEither'
import { Fx } from './Fx'

export const of = FxT.of(SEE.Pointed)
export const ap = FxT.ap({ ...SEE.MonadRec, ...SEE.Apply })
export const chain = FxT.chain<SEE.URI>()
export const chainRec = FxT.chainRec(SEE.MonadRec)
export const doStateEnvEither = FxT.getDo<SEE.URI>()
export const liftStateEnvEither = FxT.liftFx<SEE.URI>()
export const map = FxT.map<SEE.URI>()
export const toStateEnvEither = FxT.toMonad<SEE.URI>(SEE.MonadRec)
export const ask = FxT.ask(SEE.FromReader)
export const asks = FxT.fromNaturalTransformation<R.URI, SEE.URI>(SEE.FromReader.fromReader)
export const fromEither = FxT.fromNaturalTransformation(SEE.FromEither.fromEither)
export const fromEnv = FxT.fromNaturalTransformation(SEE.FromEnv.fromEnv)
export const fromIO = FxT.fromNaturalTransformation(SEE.FromIO.fromIO)
export const fromResume = FxT.fromNaturalTransformation(SEE.FromResume.fromResume)
export const fromState = FxT.fromNaturalTransformation(SEE.FromState.fromState)
export const fromTask = FxT.fromNaturalTransformation(SEE.FromTask.fromTask)
export const useSome = FxT.useSome({ ...SEE.UseSome, ...SEE.MonadRec })
export const useAll = FxT.useAll({ ...SEE.UseAll, ...SEE.MonadRec })
export const provideSome = FxT.provideSome({ ...SEE.ProvideSome, ...SEE.MonadRec })
export const provideAll = FxT.provideAll({ ...SEE.ProvideAll, ...SEE.MonadRec })
export const Do = flow(doStateEnvEither, toStateEnvEither)

export const URI = '@typed/fp/Fx/StateEnvEither'
export type URI = typeof URI

export interface FxStateEnvEither<S, R, E, A> extends Fx<SEE.StateEnvEither<S, R, E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind4<S, R, E, A> {
    [URI]: FxStateEnvEither<S, R, E, A>
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

export const ChainRec: ChainRec4<URI> = {
  chainRec,
}

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
