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
} from '../HKT'

export interface AssociativeBoth<T extends HKT> {
  readonly both: <B>(second: Kind<T, B>) => <A>(first: Kind<T, A>) => Kind<T, readonly [A, B]>
}

export interface AssociativeBoth2<T extends HKT2> {
  readonly both: <E, B>(
    second: Kind2<T, E, B>,
  ) => <A>(first: Kind2<T, E, A>) => Kind2<T, E, readonly [A, B]>
}

export interface AssociativeBoth3<T extends HKT3> {
  readonly both: <R, E, B>(
    second: Kind3<T, R, E, B>,
  ) => <A>(first: Kind3<T, E, A>) => Kind3<T, E, readonly [A, B]>
}

export interface AssociativeBoth4<T extends HKT4> {
  readonly both: <S, R, E, B>(
    second: Kind4<T, S, R, E, B>,
  ) => <A>(first: Kind4<T, A>) => Kind4<T, readonly [A, B]>
}

export interface AssociativeBoth5<T extends HKT5> {
  readonly both: <U, S, R, E, B>(
    second: Kind5<T, U, S, R, E, B>,
  ) => <A>(first: Kind5<T, A>) => Kind5<T, readonly [A, B]>
}

export interface AssociativeBoth6<T extends HKT6> {
  readonly both: <V, U, S, R, E, B>(
    second: Kind6<T, V, U, S, R, E, B>,
  ) => <A>(first: Kind6<T, A>) => Kind6<T, readonly [A, B]>
}

export interface AssociativeBoth7<T extends HKT7> {
  readonly both: <W, V, U, S, R, E, B>(
    second: Kind7<T, W, V, U, S, R, E, B>,
  ) => <A>(first: Kind7<T, A>) => Kind7<T, readonly [A, B]>
}

export interface AssociativeBoth8<T extends HKT8> {
  readonly both: <X, W, V, U, S, R, E, B>(
    second: Kind8<T, X, W, V, U, S, R, E, B>,
  ) => <A>(first: Kind8<T, A>) => Kind8<T, readonly [A, B]>
}

export interface AssociativeBoth9<T extends HKT9> {
  readonly both: <Y, X, W, V, U, S, R, E, B>(
    second: Kind9<T, Y, X, W, V, U, S, R, E, B>,
  ) => <A>(first: Kind9<T, A>) => Kind9<T, readonly [A, B]>
}

export interface AssociativeBoth10<T extends HKT10> {
  readonly both: <Z, Y, X, W, V, U, S, R, E, B>(
    second: Kind10<T, Z, Y, X, W, V, U, S, R, E, B>,
  ) => <A>(first: Kind10<T, A>) => Kind10<T, readonly [A, B]>
}
