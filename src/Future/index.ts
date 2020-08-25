import { Effect, effect, effectSeq, URI as EffectURI } from '@typed/fp/Effect'
import { Alt3 } from 'fp-ts/es6/Alt'
import { Either } from 'fp-ts/es6/Either'
import { EitherM2, getEitherM } from 'fp-ts/es6/EitherT'
import { pipeable } from 'fp-ts/es6/pipeable'
import { Monad3 } from 'fp-ts/lib/Monad'

export const URI = '@typed/fp/Future'
export type URI = typeof URI

export type Future<E, A, B> = Effect<E, Either<A, B>>

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: Future<R, E, A>
  }
}

export const future: Monad3<URI> & Alt3<URI> & EitherM2<EffectURI> = { ...getEitherM(effect), URI }
export const futureSeq: Monad3<URI> & Alt3<URI> & EitherM2<EffectURI> = {
  ...getEitherM(effectSeq),
  URI,
}

export const {
  alt,
  ap,
  apFirst,
  apSecond,
  chain,
  chainFirst,
  map,
  bimap,
  mapLeft,
  flatten,
} = pipeable(future)
