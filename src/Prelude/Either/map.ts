import { Unary } from '../function'
import { Either, isRight, Right } from './Either'

export const map =
  <A, B>(f: Unary<A, B>) =>
  <E>(either: Either<E, A>): Either<E, B> =>
    isRight(either) ? Right(f(either.value)) : either
