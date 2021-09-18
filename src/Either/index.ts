import * as AssociativeBoth from '@/AssociativeBoth'
import * as AssociativeEither from '@/AssociativeEither'
import { Covariant } from '@/Covariant'
import { constFalse, constTrue, pipe } from '@/Function'

export type Either<A, B> = Left<A> | Right<B>

export interface Left<A> {
  readonly type: 'Left'
  readonly left: A
}

export const Left = <E, A = never>(left: E): Either<E, A> => ({ type: 'Left', left })

export interface Right<A> {
  readonly type: 'Right'
  readonly right: A
}

export const Right = <A, E = never>(right: A): Either<E, A> => ({ type: 'Right', right })

export const URI = 'Either'
export type URI = typeof URI

export const match =
  <A, C, B, D>(onLeft: (value: A) => C, onRight: (value: B) => D) =>
  (either: Either<A, B>) =>
    either.type === 'Left' ? onLeft(either.left) : onRight(either.right)

export const isLeft = match(constTrue, constFalse) as <A, B>(
  either: Either<A, B>,
) => either is Left<A>

export const isRight = match(constFalse, constTrue) as <A, B>(
  either: Either<A, B>,
) => either is Right<B>

declare module '@/Hkt' {
  export interface UriToKind2<A, B> {
    [URI]: Either<A, B>
  }

  export interface UriToVariance {
    [URI]: V<'E', '+'>
  }
}

export const map =
  <A, B>(f: (a: A) => B) =>
  <E>(either: Either<E, A>): Either<E, B> =>
    isLeft(either) ? either : Right(f(either.right))

export const covariant: Covariant<URI> = {
  map: (either, f) => map(f)(either),
}

export const associativeBoth: AssociativeBoth.AssociativeBoth<URI> = {
  both: (l, r) => (isLeft(l) ? l : isLeft(r) ? r : Right([l.right, r.right] as const)),
}

export const zip = AssociativeBoth.zip(associativeBoth)

export const zipAll = AssociativeBoth.zipAll({ ...associativeBoth, ...covariant })

export const associativeEither: AssociativeEither.AssociativeEither<URI> = {
  either: (l, r) =>
    pipe(
      l,
      match(
        () => pipe(r, map(Right)),
        (a) => Right(Left(a)),
      ),
    ),
}

export const race = AssociativeEither.race(associativeEither)
