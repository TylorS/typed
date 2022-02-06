import { Left } from '@/Left'
import { Right } from '@/Right'

export type Either<E, A> = Left<E> | Right<A>

export { Left, Right }

export const isLeft = <E, A>(either: Either<E, A>): either is Left<E> => either.type === 'Left'
export const isRight = <E, A>(either: Either<E, A>): either is Right<A> => either.type === 'Right'

export const mapLeft =
  <E1, E2>(f: (e: E1) => E2) =>
  <A>(either: Either<E1, A>): Either<E2, A> =>
    isLeft(either) ? Left(f(either.value)) : either

export const match =
  <E, B, A, C>(onLeft: (e: E) => B, onRight: (a: A) => C) =>
  (either: Either<E, A>) =>
    isLeft(either) ? onLeft(either.value) : onRight(either.value)
