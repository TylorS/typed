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

export type EitherT<T extends HKT, A, B> = Kind<T, Either<A, B>>

export type EitherT1<T extends HKT, A, B> = Kind<T, Either<A, B>>

export type EitherT2<T extends HKT2, E, A, B> = Kind2<T, E, Either<A, B>>

export type EitherT3<T extends HKT3, R, E, A, B> = Kind3<T, R, E, Either<A, B>>

export type EitherT4<T extends HKT4, S, R, E, A, B> = Kind4<T, S, R, E, Either<A, B>>

export type EitherT5<T extends HKT5, U, S, R, E, A, B> = Kind5<T, U, S, R, E, Either<A, B>>

export type EitherT6<T extends HKT6, V, U, S, R, E, A, B> = Kind6<T, V, U, S, R, E, Either<A, B>>

export type EitherT7<T extends HKT7, W, V, U, S, R, E, A, B> = Kind7<
  T,
  W,
  V,
  U,
  S,
  R,
  E,
  Either<A, B>
>

export type EitherT8<T extends HKT8, X, W, V, U, S, R, E, A, B> = Kind8<
  T,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  Either<A, B>
>

export type EitherT9<T extends HKT9, Y, X, W, V, U, S, R, E, A, B> = Kind9<
  T,
  Y,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  Either<A, B>
>

export type EitherT10<T extends HKT10, Z, Y, X, W, V, U, S, R, E, A, B> = Kind10<
  T,
  Z,
  Y,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  Either<A, B>
>
