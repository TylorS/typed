import * as Fx from '@fp/Fx'
import { Alt3 } from 'fp-ts/Alt'
import { Apply3 } from 'fp-ts/Apply'
import { Bifunctor3 } from 'fp-ts/Bifunctor'
import { Either, left as left_, right as right_ } from 'fp-ts/Either'
import * as ET from 'fp-ts/EitherT'
import { flow } from 'fp-ts/function'
import { Functor3 } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { Pointed3 } from 'fp-ts/Pointed'

import { FxEither, PureEither } from './FxEither'

export const left: <E, A = never>(e: E) => PureEither<E, A> = flow(left_, Fx.pure)
export const right: <A, E = never>(a: A) => PureEither<E, A> = flow(right_, Fx.pure)
export const rightFx = ET.rightF(Fx.Functor)
export const leftFx = ET.leftF(Fx.Functor)

export const URI = '@typed/fp/FxEither'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: FxEither<R, E, A>
  }
}

export const map = ET.map(Fx.Functor)

export const Functor: Functor3<URI> = {
  URI,
  map,
}

export const Pointed: Pointed3<URI> = {
  ...Functor,
  of: right,
}

export const chain = ET.chain(Fx.Monad) as <A, ME, E1, B>(
  f: (a: A) => Fx.Fx<ME, Either<E1, B>, unknown>,
) => <E2>(ma: Fx.Fx<ME, Either<E2, A>, unknown>) => Fx.Fx<ME, Either<E1 | E2, B>, unknown>

export const Chain: Monad3<URI> = {
  ...Pointed,
  chain,
}

export const ap = ET.ap(Fx.Apply) as <FE, E1, A>(
  fa: Fx.Fx<FE, Either<E1, A>, unknown>,
) => <E2, B>(
  fab: Fx.Fx<FE, Either<E2, (a: A) => B>, unknown>,
) => Fx.Fx<FE, Either<E1 | E2, B>, unknown>

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const alt = ET.alt(Fx.Monad)

export const Alt: Alt3<URI> = {
  ...Functor,
  alt,
}

export const bimap = ET.bimap(Fx.Functor)
export const mapLeft = ET.mapLeft(Fx.Functor)

export const Bifunctor: Bifunctor3<URI> = {
  ...Functor,
  mapLeft,
  bimap,
}

export const getOrElse = ET.getOrElse(Fx.Monad)
export const orElse = ET.orElse(Fx.Monad)
export const swap = ET.swap(Fx.Functor)
export const toUnion = ET.toUnion(Fx.Functor)
export const match = ET.match(Fx.Monad)
