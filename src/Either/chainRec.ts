import { Arity1 } from '@fp/lambda'
import { MonadRec2 } from '@fp/MonadRec'
import { Either, isRight, Monad, URI as EitherURI } from 'fp-ts/dist/Either'

export const chainRec = <A, E, B>(f: Arity1<A, Either<E, Either<A, B>>>) => (
  value: A,
): Either<E, B> => {
  let outer = f(value)

  while (isRight(outer)) {
    const inner = outer.right

    if (isRight(inner)) {
      return inner
    }

    outer = f(inner.left)
  }

  return outer
}

export const MonadRec: MonadRec2<EitherURI> = {
  ...Monad,
  chainRec,
}
