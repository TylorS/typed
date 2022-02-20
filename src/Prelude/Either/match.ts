import { Either, isLeft } from './Either'

export const match =
  <E, B, A, C>(onLeft: (e: E) => B, onRight: (a: A) => C) =>
  (either: Either<E, A>) =>
    isLeft(either) ? onLeft(either.left) : onRight(either.right)
