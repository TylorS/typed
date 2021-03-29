import { Kind } from './Hkt'
import * as R from './Resume'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed1 } from 'fp-ts/Pointed'
import { flow } from 'fp-ts/function'
import { Functor1 } from 'fp-ts/Functor'
import { Apply1 } from 'fp-ts/Apply'
import { Applicative1 } from 'fp-ts/Applicative'
import { Chain1 } from 'fp-ts/Chain'
import { Monad1 } from 'fp-ts/Monad'
import { Alt1 } from 'fp-ts/Alt'
import { Alternative1 } from 'fp-ts/Alternative'

export type ResumeOption<A> = Kind<[R.URI, O.URI], [A]>

export const alt = OT.alt(R.Monad)
export const ap = OT.ap(R.Apply)
export const chain = OT.chain(R.Monad)
export const chainNullableK = OT.chainNullableK(R.Monad)
export const chainOptionK = OT.chainOptionK(R.Monad)
export const fromEither = OT.fromEither(R.Monad)
export const fromResume = OT.fromF(R.Monad)
export const fromNullable = OT.fromNullable(R.Pointed)
export const fromNullableK = OT.fromNullableK(R.Pointed)
export const fromOptionK = OT.fromOptionK(R.Pointed)
export const fromPredicate = OT.fromPredicate(R.Pointed)
export const getOrElse = OT.getOrElse(R.Functor)
export const getOrElseE = OT.getOrElseE(R.Monad)
export const map = OT.map(R.Functor)
export const match = OT.match(R.Functor)
export const matchE = OT.matchE(R.Chain)
export const some = OT.some(R.Pointed)
export const zero = OT.zero(R.Pointed)

export const URI = '@typed/fp/ResumeOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: ResumeOption<A>
  }
}

export const Pointed: Pointed1<URI> = {
  of: flow(O.some, R.of),
}

export const Functor: Functor1<URI> = {
  map,
}

export const Apply: Apply1<URI> = {
  ...Functor,
  ap,
}

export const Applicative: Applicative1<URI> = {
  ...Apply,
  ...Pointed,
}

export const Chain: Chain1<URI> = {
  ...Functor,
  chain,
}

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const Alt: Alt1<URI> = {
  ...Functor,
  alt,
}

export const Alternative: Alternative1<URI> = {
  ...Alt,
  zero,
}
