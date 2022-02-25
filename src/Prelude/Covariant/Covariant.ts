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

import { Unary } from '../function'

export interface Covariant<T extends HKT> {
  readonly map: <A, B>(f: Unary<A, B>) => (kind: Kind<T, A>) => Kind<T, B>
}

export interface Covariant1<T extends HKT> {
  readonly map: <A, B>(f: Unary<A, B>) => (kind: Kind<T, A>) => Kind<T, B>
}

export interface Covariant2<T extends HKT2> {
  readonly map: <A, B>(f: Unary<A, B>) => <E>(kind: Kind2<T, E, A>) => Kind2<T, E, B>
}

export interface Covariant3<T extends HKT3> {
  readonly map: <A, B>(f: Unary<A, B>) => <R, E>(kind: Kind3<T, R, E, A>) => Kind3<T, R, E, B>
}

export interface Covariant4<T extends HKT4> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <S, R, E>(kind: Kind4<T, S, R, E, A>) => Kind4<T, S, R, E, B>
}

export interface Covariant5<T extends HKT5> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <U, S, R, E>(kind: Kind5<T, U, S, R, E, A>) => Kind5<T, U, S, R, E, B>
}

export interface Covariant6<T extends HKT6> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <V, U, S, R, E>(kind: Kind6<T, V, U, S, R, E, A>) => Kind6<T, V, U, S, R, E, B>
}

export interface Covariant7<T extends HKT7> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <W, V, U, S, R, E>(kind: Kind7<T, W, V, U, S, R, E, A>) => Kind7<T, W, V, U, S, R, E, B>
}

export interface Covariant8<T extends HKT8> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <X, W, V, U, S, R, E>(
    kind: Kind8<T, X, W, V, U, S, R, E, A>,
  ) => Kind8<T, X, W, V, U, S, R, E, B>
}

export interface Covariant9<T extends HKT9> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <Y, X, W, V, U, S, R, E>(
    kind: Kind9<T, Y, X, W, V, U, S, R, E, A>,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, B>
}

export interface Covariant10<T extends HKT10> {
  readonly map: <A, B>(
    f: Unary<A, B>,
  ) => <Z, Y, X, W, V, U, S, R, E>(
    kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, A>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, B>
}
