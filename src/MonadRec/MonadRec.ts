import { Either, isLeft } from 'fp-ts/Either'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/HKT'
import { Monad, Monad1, Monad2, Monad2C, Monad3 } from 'fp-ts/Monad'

export interface MonadRec<F> extends Monad<F> {
  readonly chainRec: <A, B>(f: (a: A) => HKT<F, Either<A, B>>) => (a: A) => HKT<F, B>
}

export interface MonadRec1<F extends URIS> extends Monad1<F> {
  readonly chainRec: <A, B>(f: (a: A) => Kind<F, Either<A, B>>) => (a: A) => Kind<F, B>
}

export interface MonadRec2<F extends URIS2> extends Monad2<F> {
  readonly chainRec: <E, A, B>(f: (a: A) => Kind2<F, E, Either<A, B>>) => (a: A) => Kind2<F, E, B>
}

export interface MonadRec2C<F extends URIS2, E> extends Monad2C<F, E> {
  readonly chainRec: <A, B>(f: (a: A) => Kind2<F, E, Either<A, B>>) => (a: A) => Kind2<F, E, B>
}

export interface MonadRec3<F extends URIS3> extends Monad3<F> {
  readonly chainRec: <R, E, A, B>(
    f: (a: A) => Kind3<F, R, E, Either<A, B>>,
  ) => (a: A) => Kind3<F, R, E, B>
}

export function tailRec<A, B>(f: (a: A) => Either<A, B>) {
  return (a: A): B => {
    let v = f(a)

    while (isLeft(v)) {
      v = f(v.left)
    }

    return v.right
  }
}
