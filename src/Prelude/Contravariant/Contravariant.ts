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

import { Unary } from '../function'

export interface Contravariant<T extends HKT> {
  readonly contramap: <B, A>(f: Unary<B, A>) => (kind: Kind<T, A>) => Kind<T, B>
}

export interface Contravariant1<T extends HKT> {
  readonly contramap: <B, A>(f: Unary<B, A>) => (kind: Kind<T, A>) => Kind<T, B>
}

export interface Contravariant2<T extends HKT2> {
  readonly contramap: <B, A>(f: Unary<B, A>) => <E>(kind: Kind2<T, E, A>) => Kind2<T, E, B>
}

export interface Contravariant3<T extends HKT3> {
  readonly contramap: <B, A>(f: Unary<B, A>) => <R, E>(kind: Kind3<T, R, E, A>) => Kind3<T, R, E, B>
}

export interface Contravariant4<T extends HKT4> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <S, R, E>(kind: Kind4<T, S, R, E, A>) => Kind4<T, S, R, E, B>
}

export interface Contravariant5<T extends HKT5> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <U, S, R, E>(kind: Kind5<T, U, S, R, E, A>) => Kind5<T, U, S, R, E, B>
}

export interface Contravariant6<T extends HKT6> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <V, U, S, R, E>(kind: Kind6<T, V, U, S, R, E, A>) => Kind6<T, V, U, S, R, E, B>
}

export interface Contravariant7<T extends HKT7> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <W, V, U, S, R, E>(kind: Kind7<T, W, V, U, S, R, E, A>) => Kind7<T, W, V, U, S, R, E, B>
}

export interface Contravariant8<T extends HKT8> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <X, W, V, U, S, R, E>(
    kind: Kind8<T, X, W, V, U, S, R, E, A>,
  ) => Kind8<T, X, W, V, U, S, R, E, B>
}

export interface Contravariant9<T extends HKT9> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <Y, X, W, V, U, S, R, E>(
    kind: Kind9<T, Y, X, W, V, U, S, R, E, A>,
  ) => Kind9<T, Y, X, W, V, U, S, R, E, B>
}

export interface Contravariant10<T extends HKT10> {
  readonly contramap: <B, A>(
    f: Unary<B, A>,
  ) => <Z, Y, X, W, V, U, S, R, E>(
    kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, A>,
  ) => Kind10<T, Z, Y, X, W, V, U, S, R, E, B>
}
