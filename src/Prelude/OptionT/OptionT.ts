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

import { Option } from '../Option'

export type OptionT<T extends HKT, A> = Kind<T, Option<A>>

export type OptionT1<T extends HKT, A> = Kind<T, Option<A>>

export type OptionT2<T extends HKT2, E, A> = Kind2<T, E, Option<A>>

export type OptionT3<T extends HKT3, R, E, A> = Kind3<T, R, E, Option<A>>

export type OptionT4<T extends HKT4, S, R, E, A> = Kind4<T, S, R, E, Option<A>>

export type OptionT5<T extends HKT5, U, S, R, E, A> = Kind5<T, U, S, R, E, Option<A>>

export type OptionT6<T extends HKT6, V, U, S, R, E, A> = Kind6<T, V, U, S, R, E, Option<A>>

export type OptionT7<T extends HKT7, W, V, U, S, R, E, A> = Kind7<T, W, V, U, S, R, E, Option<A>>

export type OptionT8<T extends HKT8, X, W, V, U, S, R, E, A> = Kind8<
  T,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  Option<A>
>

export type OptionT9<T extends HKT9, Y, X, W, V, U, S, R, E, A> = Kind9<
  T,
  Y,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  Option<A>
>

export type OptionT10<T extends HKT10, Z, Y, X, W, V, U, S, R, E, A> = Kind10<
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
  Option<A>
>
