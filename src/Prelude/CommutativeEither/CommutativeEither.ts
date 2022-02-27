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

export interface CommutativeEither<T extends HKT> {
  readonly either: <B>(second: Kind<T, B>) => <A>(first: Kind<T, A>) => Kind<T, Either<A, B>>
}

export interface CommutativeEither1<T extends HKT> {
  readonly either: <B>(second: Kind<T, B>) => <A>(first: Kind<T, A>) => Kind<T, Either<A, B>>
}

export interface CommutativeEither2<T extends HKT2> {
  readonly either: <E, B>(
    second: Kind2<T, E, B>,
  ) => <A>(first: Kind2<T, E, A>) => Kind2<T, E, Either<A, B>>
}

export interface CommutativeEither3<T extends HKT3> {
  readonly either: <R, E, B>(
    second: Kind3<T, R, E, B>,
  ) => <A>(first: Kind3<T, R, E, A>) => Kind3<T, R, E, Either<A, B>>
}

export interface CommutativeEither4<T extends HKT4> {
  readonly either: <S, R, E, B>(
    second: Kind4<T, S, R, E, B>,
  ) => <A>(first: Kind4<T, S, R, E, A>) => Kind4<T, S, R, E, Either<A, B>>
}

export interface CommutativeEither5<T extends HKT5> {
  readonly either: <U, S, R, E, B>(
    second: Kind5<T, U, S, R, E, B>,
  ) => <A>(first: Kind5<T, U, S, R, E, A>) => Kind5<T, U, S, R, E, Either<A, B>>
}

export interface CommutativeEither6<T extends HKT6> {
  readonly either: <V, U, S, R, E, B>(
    second: Kind6<T, V, U, S, R, E, B>,
  ) => <A>(first: Kind6<T, V, U, S, R, E, A>) => Kind6<T, V, U, S, R, E, Either<A, B>>
}

export interface CommutativeEither7<T extends HKT7> {
  readonly either: <W, V, U, S, R, E, B>(
    second: Kind7<T, W, V, U, S, R, E, B>,
  ) => <A>(first: Kind7<T, W, V, U, S, R, E, A>) => Kind7<T, W, V, U, S, R, E, Either<A, B>>
}

export interface CommutativeEither8<T extends HKT8> {
  readonly either: <X, W, V, U, S, R, E, B>(
    second: Kind8<T, X, W, V, U, S, R, E, B>,
  ) => <A>(first: Kind8<T, X, W, V, U, S, R, E, A>) => Kind8<T, X, W, V, U, S, R, E, Either<A, B>>
}

export interface CommutativeEither9<T extends HKT9> {
  readonly either: <Y, X, W, V, U, S, R, E, B>(
    second: Kind9<T, Y, X, W, V, U, S, R, E, B>,
  ) => <A>(
    first: Kind9<T, Y, X, W, V, U, S, R, E, A>,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, Either<A, B>>
}

export interface CommutativeEither10<T extends HKT10> {
  readonly either: <Z, Y, X, W, V, U, S, R, E, B>(
    second: Kind10<T, Z, Y, X, W, V, U, S, R, E, B>,
  ) => <A>(
    first: Kind10<T, Z, Y, X, W, V, U, S, R, E, A>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, Either<A, B>>
}
