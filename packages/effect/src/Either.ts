export type Either<E, A> = Left<E> | Right<A>

export class Left<E> {
  readonly _tag = "Left"
  constructor(readonly left: E) {}
}

export class Right<A> {
  readonly _tag = "Right"
  constructor(readonly right: A) {}
}

export const left = <E>(left: E): Left<E> => new Left(left)

export const right = <A>(right: A): Right<A> => new Right(right)

export function isLeft<E, A>(fa: Either<E, A>): fa is Left<E> {
  return fa._tag === "Left"
}

export function isRight<E, A>(fa: Either<E, A>): fa is Right<A> {
  return fa._tag === "Right"
}
