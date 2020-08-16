import { Effect, effect, effectSeq } from '@typed/fp/Effect'
import { Either } from 'fp-ts/es6/Either'
import { getEitherM } from 'fp-ts/es6/EitherT'
import { pipeable } from 'fp-ts/lib/pipeable'

export const URI = '@typed/fp/Future'
export type URI = typeof URI

export type Future<E, A, B> = Effect<E, Either<A, B>>

declare module 'fp-ts/es6/HKT' {
  export interface URItoKind3<R, E, A> {
    [URI]: Future<R, E, A>
  }
}

export const future = getEitherM(effect)
export const futureSeq = getEitherM(effectSeq)

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
} = pipeable({
  URI,
  ...future,
})
