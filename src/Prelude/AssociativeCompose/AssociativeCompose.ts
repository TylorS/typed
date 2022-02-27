import {
  HKT2,
  HKT3,
  HKT4,
  HKT5,
  HKT6,
  HKT7,
  HKT8,
  HKT9,
  HKT10,
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

export interface AssociativeCompose<T extends HKT2> {
  readonly compose: <A, B>(second: Kind2<T, A, B>) => <C>(first: Kind2<T, B, C>) => Kind2<T, A, C>
}

export interface AssociativeCompose2<T extends HKT2> {
  readonly compose: <A, B>(second: Kind2<T, A, B>) => <C>(first: Kind2<T, B, C>) => Kind2<T, A, C>
}

export interface AssociativeCompose3<T extends HKT3> {
  readonly compose: <R, A, B>(
    second: Kind3<T, R, A, B>,
  ) => <C>(first: Kind3<T, R, B, C>) => Kind3<T, R, A, C>
}

export interface AssociativeCompose4<T extends HKT4> {
  readonly compose: <S, R, A, B>(
    second: Kind4<T, S, R, A, B>,
  ) => <C>(first: Kind4<T, S, R, B, C>) => Kind4<T, S, R, A, C>
}

export interface AssociativeCompose5<T extends HKT5> {
  readonly compose: <U, S, R, A, B>(
    second: Kind5<T, U, S, R, A, B>,
  ) => <C>(first: Kind5<T, U, S, R, B, C>) => Kind5<T, U, S, R, A, C>
}

export interface AssociativeCompose6<T extends HKT6> {
  readonly compose: <V, U, S, R, A, B>(
    second: Kind6<T, V, U, S, R, A, B>,
  ) => <C>(first: Kind6<T, V, U, S, R, B, C>) => Kind6<T, V, U, S, R, A, C>
}

export interface AssociativeCompose7<T extends HKT7> {
  readonly compose: <W, V, U, S, R, A, B>(
    second: Kind7<T, W, V, U, S, R, A, B>,
  ) => <C>(first: Kind7<T, W, V, U, S, R, B, C>) => Kind7<T, W, V, U, S, R, A, C>
}

export interface AssociativeCompose8<T extends HKT8> {
  readonly compose: <X, W, V, U, S, R, A, B>(
    second: Kind8<T, X, W, V, U, S, R, A, B>,
  ) => <C>(first: Kind8<T, X, W, V, U, S, R, B, C>) => Kind8<T, X, W, V, U, S, R, A, C>
}

export interface AssociativeCompose9<T extends HKT9> {
  readonly compose: <Y, X, W, V, U, S, R, A, B>(
    second: Kind9<T, Y, X, W, V, U, S, R, A, B>,
  ) => <C>(first: Kind9<T, Y, X, W, V, U, S, R, B, C>) => Kind9<T, Y, X, W, V, U, S, R, A, C>
}

export interface AssociativeCompose10<T extends HKT10> {
  readonly compose: <Z, Y, X, W, V, U, S, R, A, B>(
    second: Kind10<T, Z, Y, X, W, V, U, S, R, A, B>,
  ) => <C>(
    first: Kind10<T, Z, Y, X, W, V, U, S, R, B, C>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, A, C>
}
