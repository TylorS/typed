import { Alt1 } from 'fp-ts/Alt'
import { Alternative1 } from 'fp-ts/Alternative'
import { Applicative1 } from 'fp-ts/Applicative'
import { Apply1 } from 'fp-ts/Apply'
import { Chain1 } from 'fp-ts/Chain'
import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { Functor1 } from 'fp-ts/Functor'
import { Monad1 } from 'fp-ts/Monad'
import * as O from 'fp-ts/Option'
import * as OT from 'fp-ts/OptionT'
import { Pointed1 } from 'fp-ts/Pointed'

import { MonadRec1 } from './MonadRec'
import * as R from './Resume'

export type ResumeOption<A> = R.Resume<O.Option<A>>

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

export const chainRec = <A, B>(f: (value: A) => ResumeOption<E.Either<A, B>>) => (
  value: A,
): ResumeOption<B> =>
  pipe(
    value,
    R.chainRec((a) =>
      pipe(
        a,
        f,
        R.map((oe) => {
          if (O.isNone(oe)) {
            return E.right(oe)
          }

          return pipe(oe.value, E.map(O.some))
        }),
      ),
    ),
  )

export const ChainRec: ChainRec1<URI> = {
  chainRec,
}

export const Monad: Monad1<URI> = {
  ...Chain,
  ...Pointed,
}

export const MonadRec: MonadRec1<URI> = {
  ...Monad,
  ...ChainRec,
}

export const Alt: Alt1<URI> = {
  ...Functor,
  alt,
}

export const Alternative: Alternative1<URI> = {
  ...Alt,
  zero,
}
