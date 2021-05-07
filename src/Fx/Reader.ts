import { flow } from 'cjs/function'
import { Applicative2 } from 'fp-ts/Applicative'
import { Apply2 } from 'fp-ts/Apply'
import { Chain2 } from 'fp-ts/Chain'
import { ChainRec2 } from 'fp-ts/ChainRec'
import { Functor2 } from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import { Pointed2 } from 'fp-ts/Pointed'
import * as FPR from 'fp-ts/Reader'

import * as FxT from '../FxT'
import { Provide2, ProvideAll2, ProvideSome2, UseAll2, UseSome2 } from '../Provide'
import * as R from '../Reader'
import { Fx } from './Fx'

export const of = FxT.of(FPR.Pointed)
export const ap = FxT.ap({ ...R.MonadRec, ...FPR.Apply })
export const chain = FxT.chain<R.URI>()
export const chainRec = FxT.chainRec(R.MonadRec)
export const doReader = FxT.getDo<R.URI>()
export const liftReader = FxT.liftFx<R.URI>()
export const map = FxT.map<R.URI>()
export const toReader = FxT.toMonad<R.URI>(R.MonadRec)
export const ask = FxT.ask(FPR.FromReader)
export const asks = FxT.asks(FPR.FromReader)
export const useSome = FxT.useSome({ ...R.UseSome, ...R.MonadRec })
export const useAll = FxT.useAll({ ...R.UseAll, ...R.MonadRec })
export const provideSome = FxT.provideSome({ ...R.ProvideSome, ...R.MonadRec })
export const provideAll = FxT.provideAll({ ...R.ProvideAll, ...R.MonadRec })
export const Do = flow(doReader, toReader)

export const URI = '@typed/fp/Fx/Reader'
export type URI = typeof URI

export interface FxReader<R, A> extends Fx<R.Reader<R, unknown>, A> {}

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: FxReader<E, A>
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
  useSome: useSome,
}

export const UseAll: UseAll2<URI> = {
  useAll: useAll,
}

export const ProvideSome: ProvideSome2<URI> = {
  provideSome: provideSome,
}

export const ProvideAll: ProvideAll2<URI> = {
  provideAll: provideAll,
}

export const Provide: Provide2<URI> = {
  useSome,
  useAll,
  provideSome,
  provideAll,
}
