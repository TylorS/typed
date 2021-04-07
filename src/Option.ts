import { ChainRec1 } from 'fp-ts/ChainRec'
import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'

import { MonadRec1 } from './MonadRec'

export const chainRec = <A, B>(f: (value: A) => O.Option<E.Either<A, B>>) => (
  value: A,
): O.Option<B> => {
  let option = f(value)

  while (O.isSome(option)) {
    if (E.isRight(option.value)) {
      return O.some(option.value.right)
    }

    option = f(option.value.left)
  }

  return option
}

export const ChainRec: ChainRec1<O.URI> = {
  chainRec,
}

export const MonadRec: MonadRec1<O.URI> = {
  ...O.Monad,
  ...ChainRec,
}

export * from 'fp-ts/Option'
