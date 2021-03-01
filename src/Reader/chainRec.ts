import { MonadRec2 } from '@typed/fp/MonadRec'
import { ChainRec2 } from 'fp-ts/dist/ChainRec'
import { Either, isLeft } from 'fp-ts/dist/Either'
import { Monad, Reader, URI } from 'fp-ts/dist/Reader'

export const chainRec = <E, A, B>(f: (value: A) => Reader<E, Either<A, B>>) => (
  value: A,
): Reader<E, B> => (e) => {
  let either = f(value)(e)

  while (isLeft(either)) {
    either = f(either.left)(e)
  }

  return either.right
}

export const ChainRec: ChainRec2<URI> = {
  chainRec,
}

export const MonadRec: MonadRec2<URI> = {
  ...Monad,
  ...ChainRec,
}
