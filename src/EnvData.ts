/**
 * EnvData is DataT of Env.
 * @since 0.9.2
 */
import * as App from 'fp-ts/Applicative'
import * as Ap from 'fp-ts/Apply'
import * as Ch from 'fp-ts/Chain'
import * as F from 'fp-ts/Functor'
import { Monad2 } from 'fp-ts/Monad'
import * as P from 'fp-ts/Pointed'

import * as D from './Data'
import * as DT from './DataT'
import * as E from './Env'

/**
 * @since 0.9.2
 * @category Model
 */
export interface EnvData<E, A> extends E.Env<E, D.Data<A>> {}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const alt = DT.alt(E.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const ap = DT.ap(E.Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chain = DT.chain(E.Monad)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const getOrElse = DT.getOrElse(E.Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const map = DT.map(E.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match = DT.match(E.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchW = DT.matchW(E.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const match3W = DT.match3W(E.Functor)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchE = DT.matchE(E.Chain)

/**
 * @since 0.9.2
 * @category Deconstructor
 */
export const matchEW = DT.matchEW(E.Chain)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const noData = DT.noData(E.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const loading = DT.loading(E.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const refresh = DT.refresh(E.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const replete = DT.replete(E.Pointed)

/**
 * @since 0.9.2
 * @category Constructor
 */
export const repleteF = DT.repleteF(E.Functor)

/**
 * @since 0.9.2
 * @category URI
 */
export const URI = '@typed/fp/EnvData'
/**
 * @since 0.9.2
 * @category URI
 */
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

/**
 * @since 0.9.2
 * @category Combinator
 */
export const of = replete

/**
 * @since 0.9.2
 * @category Instance
 */
export const Pointed: P.Pointed2<URI> = {
  of,
}

/**
 * @since 0.9.2
 * @category Instance
 */
export const Functor: F.Functor2<URI> = {
  map,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bindTo = F.bindTo(Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const flap = F.flap(Functor)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const tupled = F.tupled(Functor)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Apply: Ap.Apply2<URI> = {
  map,
  ap,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apFirst = Ap.apFirst(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apS = Ap.apS(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apSecond = Ap.apSecond(Apply)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const apT = Ap.apT(Apply)

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getApplySemigroup = Ap.getApplySemigroup(Apply)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Applicative: App.Applicative2<URI> = {
  ...Pointed,
  ...Apply,
}

/**
 * @since 0.9.2
 * @category Typeclass Constructor
 */
export const getApplicativeMonoid = App.getApplicativeMonoid(Applicative)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Chain: Ch.Chain2<URI> = {
  map,
  chain,
}

/**
 * @since 0.9.2
 * @category Combinator
 */
export const bind = Ch.bind(Chain)

/**
 * @since 0.9.2
 * @category Combinator
 */
export const chainFirst = Ch.chainFirst(Chain)

/**
 * @since 0.9.2
 * @category Instance
 */
export const Monad: Monad2<URI> = {
  ...Pointed,
  ...Chain,
}

// TODO: Additional typeclasses
