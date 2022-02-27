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

export interface CovariantWithIndex<T extends HKT> {
  readonly map: <A, B>(f: (a: A, index: number) => B) => (kind: Kind<T, A>) => Kind<T, B>
}

export interface CovariantWithIndex1<T extends HKT> {
  readonly map: <A, B>(f: (a: A, index: number) => B) => (kind: Kind<T, A>) => Kind<T, B>
}

export interface CovariantWithIndex2<T extends HKT2> {
  readonly map: <A, B>(f: (a: A, index: number) => B) => <E>(kind: Kind2<T, E, A>) => Kind2<T, E, B>
}

export interface CovariantWithIndex3<T extends HKT3> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <R, E>(kind: Kind3<T, R, E, A>) => Kind3<T, R, E, B>
}

export interface CovariantWithIndex4<T extends HKT4> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <S, R, E>(kind: Kind4<T, S, R, E, A>) => Kind4<T, S, R, E, B>
}

export interface CovariantWithIndex5<T extends HKT5> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <U, S, R, E>(kind: Kind5<T, U, S, R, E, A>) => Kind5<T, U, S, R, E, B>
}

export interface CovariantWithIndex6<T extends HKT6> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <V, U, S, R, E>(kind: Kind6<T, V, U, S, R, E, A>) => Kind6<T, V, U, S, R, E, B>
}

export interface CovariantWithIndex7<T extends HKT7> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <W, V, U, S, R, E>(kind: Kind7<T, W, V, U, S, R, E, A>) => Kind7<T, W, V, U, S, R, E, B>
}

export interface CovariantWithIndex8<T extends HKT8> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <X, W, V, U, S, R, E>(
    kind: Kind8<T, X, W, V, U, S, R, E, A>,
  ) => Kind8<T, X, W, V, U, S, R, E, B>
}

export interface CovariantWithIndex9<T extends HKT9> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <Y, X, W, V, U, S, R, E>(
    kind: Kind9<T, Y, X, W, V, U, S, R, E, A>,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, B>
}

export interface CovariantWithIndex10<T extends HKT10> {
  readonly map: <A, B>(
    f: (a: A, index: number) => B,
  ) => <Z, Y, X, W, V, U, S, R, E>(
    kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, A>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, B>
}
