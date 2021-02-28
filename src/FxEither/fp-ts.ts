import { Apply as Apply_, Functor as Functor_, Fx, Monad as Monad_, pure } from '@typed/fp/Fx'
import { Alt3 } from 'fp-ts/dist/Alt'
import { Apply3 } from 'fp-ts/dist/Apply'
import { Bifunctor3 } from 'fp-ts/dist/Bifunctor'
import { Either, left as left_, right as right_ } from 'fp-ts/dist/Either'
import * as ET from 'fp-ts/dist/EitherT'
import { flow } from 'fp-ts/dist/function'
import { Functor3 } from 'fp-ts/dist/Functor'
import { Monad3 } from 'fp-ts/dist/Monad'
import { Pointed3 } from 'fp-ts/dist/Pointed'

import { FxEither, PureEither } from './FxEither'

export const left: <E, A = never>(e: E) => PureEither<E, A> = flow(left_, pure)
export const right: <A, E = never>(a: A) => PureEither<E, A> = flow(right_, pure)
export const rightFx = ET.rightF(Functor_)
export const leftFx = ET.leftF(Functor_)

export const URI = '@typed/fp/FxEither'
export type URI = typeof URI

declare module 'fp-ts/dist/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: FxEither<R, E, A>
  }
}

export const map = ET.map(Functor_)

export const Functor: Functor3<URI> = {
  URI,
  map,
}

export const Pointed: Pointed3<URI> = {
  of: right,
}

export const chain = ET.chain(Monad_) as <A, ME, E1, B>(
  f: (a: A) => Fx<ME, Either<E1, B>, unknown>,
) => <E2>(ma: Fx<ME, Either<E2, A>, unknown>) => Fx<ME, Either<E1 | E2, B>, unknown>

export const Monad: Monad3<URI> = {
  ...Pointed,
  ...Functor,
  chain,
}

export const ap = ET.ap(Apply_) as <FE, E1, A>(
  fa: Fx<FE, Either<E1, A>, unknown>,
) => <E2, B>(fab: Fx<FE, Either<E2, (a: A) => B>, unknown>) => Fx<FE, Either<E1 | E2, B>, unknown>

export const Apply: Apply3<URI> = {
  ...Functor,
  ap,
}

export const alt = ET.alt(Monad_)

export const Alt: Alt3<URI> = {
  ...Functor,
  alt,
}

export const bimap = ET.bimap(Functor_)
export const mapLeft = ET.mapLeft(Functor_)

export const Bifunctor: Bifunctor3<URI> = {
  ...Functor,
  mapLeft,
  bimap,
}

export const getOrElse = ET.getOrElse(Monad_)
export const orElse = ET.orElse(Monad_)
export const swap = ET.swap(Functor_)
export const toUnion = ET.toUnion(Functor_)
export const match = ET.match(Monad_)
