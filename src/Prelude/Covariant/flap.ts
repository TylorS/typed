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

import {
  Covariant,
  Covariant1,
  Covariant2,
  Covariant3,
  Covariant4,
  Covariant5,
  Covariant6,
  Covariant7,
  Covariant8,
  Covariant9,
  Covariant10,
} from './Covariant'

export function flap<T extends HKT10>(
  C: Covariant10<T>,
): <A>(
  a: A,
) => <Z, Y, X, W, V, U, S, R, E, B>(
  kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind10<T, Z, Y, X, W, V, U, S, R, E, B>

export function flap<T extends HKT9>(
  C: Covariant9<T>,
): <A>(
  a: A,
) => <Y, X, W, V, U, S, R, E, B>(
  kind: Kind9<T, Y, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind9<T, Y, X, W, V, U, S, R, E, B>

export function flap<T extends HKT8>(
  C: Covariant8<T>,
): <A>(
  a: A,
) => <X, W, V, U, S, R, E, B>(
  kind: Kind8<T, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind8<T, X, W, V, U, S, R, E, B>

export function flap<T extends HKT7>(
  C: Covariant7<T>,
): <A>(
  a: A,
) => <W, V, U, S, R, E, B>(
  kind: Kind7<T, W, V, U, S, R, E, (a: A) => B>,
) => Kind7<T, W, V, U, S, R, E, B>

export function flap<T extends HKT6>(
  C: Covariant6<T>,
): <A>(
  a: A,
) => <V, U, S, R, E, B>(kind: Kind6<T, V, U, S, R, E, (a: A) => B>) => Kind6<T, V, U, S, R, E, B>

export function flap<T extends HKT5>(
  C: Covariant5<T>,
): <A>(a: A) => <U, S, R, E, B>(kind: Kind5<T, U, S, R, E, (a: A) => B>) => Kind5<T, U, S, R, E, B>

export function flap<T extends HKT4>(
  C: Covariant4<T>,
): <A>(a: A) => <S, R, E, B>(kind: Kind4<T, S, R, E, (a: A) => B>) => Kind4<T, S, R, E, B>

export function flap<T extends HKT3>(
  C: Covariant3<T>,
): <A>(a: A) => <R, E, B>(kind: Kind3<T, R, E, (a: A) => B>) => Kind3<T, R, E, B>

export function flap<T extends HKT2>(
  C: Covariant2<T>,
): <A>(a: A) => <E, B>(kind: Kind2<T, E, (a: A) => B>) => Kind2<T, E, B>

export function flap<T extends HKT>(
  C: Covariant1<T>,
): <A>(a: A) => <B>(kind: Kind<T, (a: A) => B>) => Kind<T, B>

export function flap<T extends HKT>(
  C: Covariant<T>,
): <A>(a: A) => <B>(kind: Kind<T, (a: A) => B>) => Kind<T, B>

export function flap<F extends HKT>(
  C: Covariant<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B> {
  return (a) => C.map((f) => f(a))
}
