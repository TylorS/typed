import {
  HKT,
  HKT2,
  HKT3,
  HKT4,
  HKT5,
  HKT6,
  HKT7,
  HKT8,
  HKT9,
  HKT10,
  Kind,
  Kind2,
  Kind3,
  Kind4,
  Kind5,
  Kind6,
  Kind7,
  Kind8,
  Kind9,
  Kind10,
} from '@/Prelude/HKT'

import { Either } from '../Either'

export interface ChainRec<T extends HKT> {
  readonly chainRec: <A, B>(f: (a: A) => Kind<T, Either<A, B>>) => Kind<T, B>
}

export interface ChainRec1<T extends HKT> {
  readonly chainRec: <A, B>(f: (a: A) => Kind<T, Either<A, B>>) => Kind<T, B>
}

export interface ChainRec2<T extends HKT2> {
  readonly chainRec: <A, E, B>(f: (a: A) => Kind2<T, E, Either<A, B>>) => Kind2<T, E, B>
}

export interface ChainRec3<T extends HKT3> {
  readonly chainRec: <A, R, E, B>(f: (a: A) => Kind3<T, R, E, Either<A, B>>) => Kind3<T, R, E, B>
}

export interface ChainRec4<T extends HKT4> {
  readonly chainRec: <A, S, R, E, B>(
    f: (a: A) => Kind4<T, S, R, E, Either<A, B>>,
  ) => Kind4<T, S, R, E, B>
}

export interface ChainRec5<T extends HKT5> {
  readonly chainRec: <A, U, S, R, E, B>(
    f: (a: A) => Kind5<T, U, S, R, E, Either<A, B>>,
  ) => Kind5<T, U, S, R, E, B>
}

export interface ChainRec6<T extends HKT6> {
  readonly chainRec: <A, V, U, S, R, E, B>(
    f: (a: A) => Kind6<T, V, U, S, R, E, Either<A, B>>,
  ) => Kind6<T, V, U, S, R, E, B>
}

export interface ChainRec7<T extends HKT7> {
  readonly chainRec: <A, W, V, U, S, R, E, B>(
    f: (a: A) => Kind7<T, W, V, U, S, R, E, Either<A, B>>,
  ) => Kind7<T, W, V, U, S, R, E, B>
}

export interface ChainRec8<T extends HKT8> {
  readonly chainRec: <A, X, W, V, U, S, R, E, B>(
    f: (a: A) => Kind8<T, X, W, V, U, S, R, E, Either<A, B>>,
  ) => Kind8<T, X, W, V, U, S, R, E, B>
}

export interface ChainRec9<T extends HKT9> {
  readonly chainRec: <A, Y, X, W, V, U, S, R, E, B>(
    f: (a: A) => Kind9<T, Y, X, W, V, U, S, R, E, Either<A, B>>,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, B>
}

export interface ChainRec10<T extends HKT10> {
  readonly chainRec: <A, Z, Y, X, W, V, U, S, R, E, B>(
    f: (a: A) => Kind10<T, Z, Y, X, W, V, U, S, R, E, Either<A, B>>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, B>
}
