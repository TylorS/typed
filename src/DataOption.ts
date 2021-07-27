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

import * as D from './Data'
import { MonadRec1 } from './MonadRec'

export type DataOption<A> = D.Data<O.Option<A>>

export const alt = OT.alt(D.Monad)
export const ap = OT.ap(D.Apply)
export const chain = OT.chain(D.Monad)
export const chainNullableK = OT.chainNullableK(D.Monad)
export const chainOptionK = OT.chainOptionK(D.Monad)
export const fromEither = OT.fromEither(D.Monad)
export const fromData = OT.fromF(D.Monad)
export const fromNullable = OT.fromNullable(D.Pointed)
export const fromNullableK = OT.fromNullableK(D.Pointed)
export const fromOptionK = OT.fromOptionK(D.Pointed)
export const fromPredicate = OT.fromPredicate(D.Pointed)
export const getOrElse = OT.getOrElse(D.Functor)
export const getOrElseE = OT.getOrElseE(D.Monad)
export const map = OT.map(D.Functor)
export const match = OT.match(D.Functor)
export const matchE = OT.matchE(D.Chain)
export const some = OT.some(D.Pointed)
export const zero = OT.zero(D.Pointed)

export const URI = '@typed/fp/DataOption'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind<A> {
    [URI]: DataOption<A>
  }
}

export const Pointed: Pointed1<URI> = {
  of: flow(O.some, D.of),
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

export const chainRec = <A, B>(f: (value: A) => DataOption<E.Either<A, B>>) =>
  D.chainRec(
    flow(
      f,
      D.map((oe) => {
        if (O.isNone(oe)) {
          return E.right(oe)
        }

        return pipe(oe.value, E.map(O.some))
      }),
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
