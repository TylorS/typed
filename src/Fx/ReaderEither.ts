import { flow } from 'cjs/function'
import { Applicative3 } from 'fp-ts/Applicative'
import { Apply3 } from 'fp-ts/Apply'
import { Chain3 } from 'fp-ts/Chain'
import { ChainRec3 } from 'fp-ts/ChainRec'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import { Provide3, ProvideAll3, ProvideSome3, UseAll3, UseSome3 } from '../Provide'
import * as E from '../ReaderEither'
import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doReaderEither = FxT.getDo<E.URI>()
export const liftReaderEither = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toReaderEither = FxT.toMonad<E.URI>(E.MonadRec)
export const ask = FxT.ask(E.FromReader)
export const asks = FxT.asks(E.FromReader)
export const useSome = FxT.useSome({ ...E.UseSome, ...E.MonadRec })
export const useAll = FxT.useAll({ ...E.UseAll, ...E.MonadRec })
export const provideSome = FxT.provideSome({ ...E.ProvideSome, ...E.MonadRec })
export const provideAll = FxT.provideAll({ ...E.ProvideAll, ...E.MonadRec })
export const Do = flow(doReaderEither, toReaderEither)

export const URI = '@typed/fp/Fx/ReaderEither'
export type URI = typeof URI

export interface FxReaderEither<R, E, A> extends Fx<E.ReaderEither<R, E, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: FxReaderEither<R, E, A>
  }
}

export const Pointed: Pointed3<URI> = {
  of,
}

export const Functor: Functor3<URI> = {
  map,
}

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative3<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain3<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad3<URI> = {
  ...Chain,
  ...Pointed,
}

export const ChainRec: ChainRec3<URI> = {
  chainRec,
}

export const UseSome: UseSome3<URI> = {
  useSome,
}

export const UseAll: UseAll3<URI> = {
  useAll,
}

export const ProvideSome: ProvideSome3<URI> = {
  provideSome,
}

export const ProvideAll: ProvideAll3<URI> = {
  provideAll,
}

export const Provide: Provide3<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
