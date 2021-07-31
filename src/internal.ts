/**
 * @typed/fp/internal is a place for shared code that doesn't belong in the public API
 * @internal
 * @since 0.9.2
 */
import * as E from 'fp-ts/Either'

/**
 * Helpful for creatin ChainRec instances for Either-based types.
 * @internal
 * @since 0.9.2
 * @category Combinator
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
