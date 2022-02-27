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

export interface Separate<T extends HKT> {
  readonly separate: <A, B>(kind: Kind<T, Either<A, B>>) => readonly [Kind<T, A>, Kind<T, B>]
}

export interface Separate1<T extends HKT> {
  readonly separate: <A, B>(kind: Kind<T, Either<A, B>>) => readonly [Kind<T, A>, Kind<T, B>]
}

export interface Separate2<T extends HKT2> {
  readonly separate: <E, A, B>(
    kind: Kind2<T, E, Either<A, B>>,
  ) => readonly [Kind2<T, E, A>, Kind2<T, E, B>]
}

export interface Separate3<T extends HKT3> {
  readonly separate: <R, E, A, B>(
    kind: Kind3<T, R, E, Either<A, B>>,
  ) => readonly [Kind3<T, R, E, A>, Kind3<T, R, E, B>]
}

export interface Separate4<T extends HKT4> {
  readonly separate: <S, R, E, A, B>(
    kind: Kind4<T, S, R, E, Either<A, B>>,
  ) => readonly [Kind4<T, S, R, E, A>, Kind4<T, S, R, E, B>]
}

export interface Separate5<T extends HKT5> {
  readonly separate: <U, S, R, E, A, B>(
    kind: Kind5<T, U, S, R, E, Either<A, B>>,
  ) => readonly [Kind5<T, U, S, R, E, A>, Kind5<T, U, S, R, E, B>]
}

export interface Separate6<T extends HKT6> {
  readonly separate: <V, U, S, R, E, A, B>(
    kind: Kind6<T, V, U, S, R, E, Either<A, B>>,
  ) => readonly [Kind6<T, V, U, S, R, E, A>, Kind6<T, V, U, S, R, E, B>]
}

export interface Separate7<T extends HKT7> {
  readonly separate: <W, V, U, S, R, E, A, B>(
    kind: Kind7<T, W, V, U, S, R, E, Either<A, B>>,
  ) => readonly [Kind7<T, W, V, U, S, R, E, A>, Kind7<T, W, V, U, S, R, E, B>]
}

export interface Separate8<T extends HKT8> {
  readonly separate: <X, W, V, U, S, R, E, A, B>(
    kind: Kind8<T, X, W, V, U, S, R, E, Either<A, B>>,
  ) => readonly [Kind8<T, X, W, V, U, S, R, E, A>, Kind8<T, X, W, V, U, S, R, E, B>]
}

export interface Separate9<T extends HKT9> {
  readonly separate: <Y, X, W, V, U, S, R, E, A, B>(
    kind: Kind9<T, Y, X, W, V, U, S, R, E, Either<A, B>>,
  ) => readonly [Kind9<T, Y, X, W, V, U, S, R, E, A>, Kind9<T, Y, X, W, V, U, S, R, E, B>]
}

export interface Separate10<T extends HKT10> {
  readonly separate: <Z, Y, X, W, V, U, S, R, E, A, B>(
    kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, Either<A, B>>,
  ) => readonly [Kind10<T, Z, Y, X, W, V, U, S, R, E, A>, Kind10<T, Z, Y, X, W, V, U, S, R, E, B>]
}
