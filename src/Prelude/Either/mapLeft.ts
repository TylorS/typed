import { Either, isLeft, Left } from './Either'

export const mapLeft =
  <E1, E2>(f: (e: E1) => E2) =>
  <A>(either: Either<E1, A>): Either<E2, A> =>
    isLeft(either) ? Left(f(either.value)) : either
