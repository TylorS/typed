import * as E from 'fp-ts/Either'

/**
 * Helpful for creatin ChainRec instances for Either-based types.
 */
export const swapEithers = <E, A, B>(
  either: E.Either<E, E.Either<A, B>>,
): E.Either<A, E.Either<E, B>> => {
  if (E.isLeft(either)) {
    return E.right(either)
  }

  const e = either.right

  if (E.isLeft(e)) {
    return e
  }

  return E.right(e)
}
