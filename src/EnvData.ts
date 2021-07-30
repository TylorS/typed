import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import * as F from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import * as P from 'fp-ts/Pointed'

import * as D from './Data'
import * as DT from './DataT'
import * as E from './Env'

export interface EnvData<E, A> extends E.Env<E, D.Data<A>> {}

export const alt = DT.alt(E.Monad)
export const ap = DT.ap(E.Apply)
export const chain = DT.chain(E.Monad)
export const getOrElse = DT.getOrElse(E.Functor)
export const map = DT.map(E.Functor)
export const match = DT.match(E.Functor)
export const matchW = DT.matchW(E.Functor)
export const match3W = DT.match3W(E.Functor)
export const matchE = DT.matchE(E.Chain)
export const matchEW = DT.matchEW(E.Chain)
export const noData = DT.noData(E.Pointed)
export const loading = DT.loading(E.Pointed)
export const refresh = DT.refresh(E.Pointed)
export const replete = DT.replete(E.Pointed)
export const repleteF = DT.repleteF(E.Functor)

export const URI = '@typed/fp/EnvData'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: EnvData<E, A>
  }
}

declare module './HKT' {
  export interface URItoVariance {
    [URI]: V<E, Contravariant>
  }
}

export const of = replete

export const Pointed: P.Pointed2<URI> = {
  of,
}

export const Functor: F.Functor2<URI> = {
  map,
}

export const bindTo = F.bindTo(Functor)
export const flap = F.flap(Functor)
export const tupled = F.tupled(Functor)

export const Apply: Ap.Apply2<URI> = {
  map,
  ap,
}

export const apFirst = Ap.apFirst(Apply)
export const apS = Ap.apS(Apply)
export const apSecond = Ap.apSecond(Apply)
export const apT = Ap.apT(Apply)
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

export const Applicative: App.Applicative2<URI> = {
  ...Pointed,
  ...Apply,
}

export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

export const Chain: Ch.Chain2<URI> = {
  map,
  chain,
}

export const bind = Ch.bind(Chain)
export const chainFirst = Ch.chainFirst(Chain)

export const Monad: Monad2<URI> = {
  ...Pointed,
  ...Chain,
}

// TODO: Additional typeclasses
