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

import { These } from '../These'

export type TheseT<T extends HKT, A, B> = Kind<T, These<A, B>>

export type TheseT1<T extends HKT, A, B> = Kind<T, These<A, B>>

export type TheseT2<T extends HKT2, E, A, B> = Kind2<T, E, These<A, B>>

export type TheseT3<T extends HKT3, R, E, A, B> = Kind3<T, R, E, These<A, B>>

export type TheseT4<T extends HKT4, S, R, E, A, B> = Kind4<T, S, R, E, These<A, B>>

export type TheseT5<T extends HKT5, U, S, R, E, A, B> = Kind5<T, U, S, R, E, These<A, B>>

export type TheseT6<T extends HKT6, V, U, S, R, E, A, B> = Kind6<T, V, U, S, R, E, These<A, B>>

export type TheseT7<T extends HKT7, W, V, U, S, R, E, A, B> = Kind7<
  T,
  W,
  V,
  U,
  S,
  R,
  E,
  These<A, B>
>

export type TheseT8<T extends HKT8, X, W, V, U, S, R, E, A, B> = Kind8<
  T,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  These<A, B>
>

export type TheseT9<T extends HKT9, Y, X, W, V, U, S, R, E, A, B> = Kind9<
  T,
  Y,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  These<A, B>
>

export type TheseT10<T extends HKT10, Z, Y, X, W, V, U, S, R, E, A, B> = Kind10<
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
  These<A, B>
>
