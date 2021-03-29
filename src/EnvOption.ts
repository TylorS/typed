import { Kind } from './Hkt'
import * as E from './Env'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed2 } from 'fp-ts/Pointed'
import { flow } from 'fp-ts/function'
import { Functor2 } from 'fp-ts/Functor'
import { Apply2 } from 'fp-ts/Apply'
import { Applicative2 } from 'fp-ts/Applicative'
import { Chain2 } from 'fp-ts/Chain'
import { Monad2 } from 'fp-ts/Monad'
import { Alt2 } from 'fp-ts/Alt'
import { Alternative2 } from 'fp-ts/Alternative'

export type EnvOption<E, A> = Kind<[E.URI, O.URI], [E, A]>

export const alt = OT.alt(E.Monad)
export const ap = OT.ap(E.Apply)
export const chain = OT.chain(E.Monad)
export const chainNullableK = OT.chainNullableK(E.Monad)
export const chainOptionK = OT.chainOptionK(E.Monad)
export const fromEither = OT.fromEither(E.Monad)
export const fromResume = OT.fromF(E.Monad)
export const fromNullable = OT.fromNullable(E.Pointed)
export const fromNullableK = OT.fromNullableK(E.Pointed)
export const fromOptionK = OT.fromOptionK(E.Pointed)
export const fromPredicate = OT.fromPredicate(E.Pointed)
export const getOrElse = OT.getOrElse(E.Functor)
export const getOrElseE = OT.getOrElseE(E.Monad)
export const map = OT.map(E.Functor)
export const match = OT.match(E.Functor)
export const matchE = OT.matchE(E.Chain)
export const some = OT.some(E.Pointed)
export const zero = OT.zero(E.Pointed)

export const URI = '@typed/fp/EnvOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind2<E, A> {
    [URI]: EnvOption<E, A>
  }
}

export const Pointed: Pointed2<URI> = {
  of: flow(O.some, E.of),
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

export const Alt: Alt2<URI> = {
  ...Functor,
  alt,
}

export const Alternative: Alternative2<URI> = {
  ...Alt,
  zero,
}
