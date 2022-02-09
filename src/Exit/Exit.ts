import * as C from '@/Cause'
import { FiberId } from '@/FiberId'
import * as E from '@/Prelude/Either'

export type Exit<E, A> = E.Either<C.Cause<E>, A>

export const success = <A, E = never>(a: A): Exit<E, A> => E.Right(a)

export const fail = <E, A = never>(error: E): Exit<E, A> => E.Left(C.Expected(error))

export const expected = <E = never, A = never>(error: E): Exit<E, A> => E.Left(C.Expected(error))

export const unexpected = <E = never, A = never>(error: unknown): Exit<E, A> =>
  E.Left(C.Unexpected(error))

export const disposed = <E = never, A = never>(id: FiberId): Exit<E, A> => E.Left(C.Disposed(id))

export const both = <E1, A, E2, B>(
  first: Exit<E1, A>,
  second: Exit<E2, B>,
): Exit<E1 | E2, A | B> => {
  if (E.isLeft(first) && E.isLeft(second)) {
    return E.Left(C.Both(first.value, second.value))
  }

  if (E.isLeft(second)) {
    return second
  }

  return first
}

export const then = <E1, A, E2, B>(
  first: Exit<E1, A>,
  second: Exit<E2, B>,
): Exit<E1 | E2, A | B> => {
  if (E.isLeft(first) && E.isLeft(second)) {
    return E.Left(C.Then(first.value, second.value))
  }

  if (E.isLeft(second)) {
    return second
  }

  return first
}

export const fromEither: <E, A>(either: E.Either<E, A>) => Exit<E, A> = E.mapLeft(C.Expected)
