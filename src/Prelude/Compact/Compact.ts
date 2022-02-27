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

export interface Compact<T extends HKT> {
  readonly comapct: <A>(kind: Kind<T, Option<A>>) => Kind<T, A>
}

export interface Compact1<T extends HKT> {
  readonly comapct: <A>(kind: Kind<T, Option<A>>) => Kind<T, A>
}

export interface Compact2<T extends HKT2> {
  readonly comapct: <E, A>(kind: Kind2<T, E, Option<A>>) => Kind2<T, E, A>
}

export interface Compact3<T extends HKT3> {
  readonly comapct: <R, E, A>(kind: Kind3<T, R, E, Option<A>>) => Kind3<T, R, E, A>
}

export interface Compact4<T extends HKT4> {
  readonly comapct: <S, R, E, A>(kind: Kind4<T, S, R, E, Option<A>>) => Kind4<T, S, R, E, A>
}

export interface Compact5<T extends HKT5> {
  readonly comapct: <U, S, R, E, A>(
    kind: Kind5<T, U, S, R, E, Option<A>>,
  ) => Kind5<T, U, S, R, E, A>
}

export interface Compact6<T extends HKT6> {
  readonly comapct: <V, U, S, R, E, A>(
    kind: Kind6<T, V, U, S, R, E, Option<A>>,
  ) => Kind6<T, V, U, S, R, E, A>
}

export interface Compact7<T extends HKT7> {
  readonly comapct: <W, V, U, S, R, E, A>(
    kind: Kind7<T, W, V, U, S, R, E, Option<A>>,
  ) => Kind7<T, W, V, U, S, R, E, A>
}

export interface Compact8<T extends HKT8> {
  readonly comapct: <X, W, V, U, S, R, E, A>(
    kind: Kind8<T, X, W, V, U, S, R, E, Option<A>>,
  ) => Kind8<T, X, W, V, U, S, R, E, A>
}

export interface Compact9<T extends HKT9> {
  readonly comapct: <Y, X, W, V, U, S, R, E, A>(
    kind: Kind9<T, Y, X, W, V, U, S, R, E, Option<A>>,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, A>
}

export interface Compact10<T extends HKT10> {
  readonly comapct: <Z, Y, X, W, V, U, S, R, E, A>(
    kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, Option<A>>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, A>
}
