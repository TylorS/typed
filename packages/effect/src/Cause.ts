import * as Either from "./Either"

export type Cause<E> = Unexpected | Interrupted | Expected<E> | Sequential<E> | Concurrent<E>

export class Unexpected {
  readonly _tag = "Unexpected"
  constructor(readonly unexpected: unknown) {}
}

export class Interrupted {
  readonly _tag = "Interrupted"
}

export class Expected<E> {
  readonly _tag = "Expected"
  constructor(readonly expected: E) {}
}

export class Sequential<E> {
  readonly _tag = "Sequential"
  constructor(readonly left: Cause<E>, readonly right: Cause<E>) {}
}

export class Concurrent<E> {
  readonly _tag = "Concurrent"
  constructor(readonly left: Cause<E>, readonly right: Cause<E>) {}
}

export const unexpected = (unexpected: unknown): Cause<never> => new Unexpected(unexpected)

export const expected = <E>(expected: E): Cause<E> => new Expected(expected)

export const sequential = <E>(left: Cause<E>, right: Cause<E>): Cause<E> => new Sequential(left, right)

export const concurrent = <E>(left: Cause<E>, right: Cause<E>): Cause<E> => new Concurrent(left, right)

export function findError<E>(cause: Cause<E>): Either.Either<E, Cause<never>> {
  switch (cause._tag) {
    case "Unexpected":
      return Either.right(cause)
    case "Interrupted":
      return Either.right(cause)
    case "Concurrent": {
      const l = findError(cause.left)
      if (Either.isLeft(l)) return l
      const r = findError(cause.right)
      if (Either.isLeft(r)) return r
      return Either.right(concurrent(l.right, r.right))
    }
    case "Sequential": {
      const l = findError(cause.left)
      if (Either.isLeft(l)) return l
      const r = findError(cause.right)
      if (Either.isLeft(r)) return r
      return Either.right(sequential(l.right, r.right))
    }
    case "Expected":
      return Either.left(cause.expected)
  }
}
