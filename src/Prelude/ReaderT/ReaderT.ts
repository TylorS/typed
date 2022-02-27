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

import { Reader } from '../Reader'

export interface ReaderT<T extends HKT, Resources, A> extends Reader<Resources, Kind<T, A>> {}

export interface ReaderT1<T extends HKT, Resources, A> extends Reader<Resources, Kind<T, A>> {}

export interface ReaderT2<T extends HKT2, Resources, E, A>
  extends Reader<Resources, Kind2<T, E, A>> {}

export interface ReaderT3<T extends HKT3, Resources, R, E, A>
  extends Reader<Resources, Kind3<T, R, E, A>> {}

export interface ReaderT4<T extends HKT4, Resources, S, R, E, A>
  extends Reader<Resources, Kind4<T, S, R, E, A>> {}

export interface ReaderT5<T extends HKT5, Resources, U, S, R, E, A>
  extends Reader<Resources, Kind5<T, U, S, R, E, A>> {}

export interface ReaderT6<T extends HKT6, Resources, V, U, S, R, E, A>
  extends Reader<Resources, Kind6<T, V, U, S, R, E, A>> {}

export interface ReaderT7<T extends HKT7, Resources, W, V, U, S, R, E, A>
  extends Reader<Resources, Kind7<T, W, V, U, S, R, E, A>> {}

export interface ReaderT8<T extends HKT8, Resources, X, W, V, U, S, R, E, A>
  extends Reader<Resources, Kind8<T, X, W, V, U, S, R, E, A>> {}

export interface ReaderT9<T extends HKT9, Resources, Y, X, W, V, U, S, R, E, A>
  extends Reader<Resources, Kind9<T, Y, X, W, V, U, S, R, E, A>> {}

export interface ReaderT10<T extends HKT10, Resources, Z, Y, X, W, V, U, S, R, E, A>
  extends Reader<Resources, Kind10<T, Z, Y, X, W, V, U, S, R, E, A>> {}
