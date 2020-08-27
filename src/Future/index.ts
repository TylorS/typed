import {
  chain as chainEff,
  doEffect,
  Effect,
  effect,
  effectSeq,
  fail,
  FailEnv,
  fromReader,
  fromTask,
  URI as EffectURI,
} from '@typed/fp/Effect'
import { Alt3 } from 'fp-ts/es6/Alt'
import { Either } from 'fp-ts/es6/Either'
import { EitherM2, getEitherM } from 'fp-ts/es6/EitherT'
import { Monad3 } from 'fp-ts/es6/Monad'
import { pipe, pipeable } from 'fp-ts/es6/pipeable'
import { ReaderTaskEither } from 'fp-ts/es6/ReaderTaskEither'
import { isLeft } from 'fp-ts/es6/These'

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

export const orFail = <K extends PropertyKey, E, A, B>(
  key: K,
  future: Future<E, A, B>,
): Effect<E & FailEnv<K, A>, B> => {
  const eff = doEffect(function* () {
    const either = yield* future

    if (isLeft(either)) {
      return yield* fail(key, either.left)
    }

    return either.right
  })

  return eff
}

export function fromReaderTaskEither<E, A, B>(rte: ReaderTaskEither<E, A, B>): Future<E, A, B> {
  return pipe(rte, fromReader, chainEff(fromTask))
}
