import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { flow } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'

import * as FxT from '../FxT'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '../Provide'
import * as E from '../ReaderOption'
import { Fx } from './Fx'

export const of = FxT.of(E.Pointed)
export const ap = FxT.ap({ ...E.MonadRec, ...E.Apply })
export const chain = FxT.chain<E.URI>()
export const chainRec = FxT.chainRec(E.MonadRec)
export const doReaderOption = FxT.getDo<E.URI>()
export const liftReaderOption = FxT.liftFx<E.URI>()
export const map = FxT.map<E.URI>()
export const toReaderOption = FxT.toMonad<E.URI>(E.MonadRec)
export const ask = FxT.ask(E.FromReader)
export const asks = FxT.asks(E.FromReader)
export const useSome = FxT.useSome({ ...E.UseSome, ...E.MonadRec })
export const useAll = FxT.useAll({ ...E.UseAll, ...E.MonadRec })
export const provideSome = FxT.provideSome({ ...E.ProvideSome, ...E.MonadRec })
export const provideAll = FxT.provideAll({ ...E.ProvideAll, ...E.MonadRec })
export const Do = flow(doReaderOption, toReaderOption)

export const URI = '@typed/fp/Fx/ReaderOption'
export type URI = typeof URI

export interface FxReaderOption<R, A> extends Fx<E.ReaderOption<R, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxReaderOption<E, A>
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
