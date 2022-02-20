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

export function flap<F extends HKT>(
  C: Covariant<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B>
export function flap<F extends HKT>(
  C: Covariant1<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B>
export function flap<F extends HKT2>(
  C: Covariant2<F>,
): <A>(a: A) => <E, B>(kind: Kind2<F, E, (a: A) => B>) => Kind2<F, E, B>
export function flap<F extends HKT3>(
  C: Covariant3<F>,
): <A>(a: A) => <R, E, B>(kind: Kind3<F, R, E, (a: A) => B>) => Kind3<F, R, E, B>
export function flap<F extends HKT4>(
  C: Covariant4<F>,
): <A>(a: A) => <S, R, E, B>(kind: Kind4<F, S, R, E, (a: A) => B>) => Kind4<F, S, R, E, B>
export function flap<F extends HKT5>(
  C: Covariant5<F>,
): <A>(a: A) => <U, S, R, E, B>(kind: Kind5<F, U, S, R, E, (a: A) => B>) => Kind5<F, U, S, R, E, B>
export function flap<F extends HKT6>(
  C: Covariant6<F>,
): <A>(
  a: A,
) => <V, U, S, R, E, B>(kind: Kind6<F, V, U, S, R, E, (a: A) => B>) => Kind6<F, V, U, S, R, E, B>
export function flap<F extends HKT7>(
  C: Covariant7<F>,
): <A>(
  a: A,
) => <W, V, U, S, R, E, B>(
  kind: Kind7<F, W, V, U, S, R, E, (a: A) => B>,
) => Kind7<F, W, V, U, S, R, E, B>
export function flap<F extends HKT8>(
  C: Covariant8<F>,
): <A>(
  a: A,
) => <X, W, V, U, S, R, E, B>(
  kind: Kind8<F, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind8<F, X, W, V, U, S, R, E, B>
export function flap<F extends HKT9>(
  C: Covariant9<F>,
): <A>(
  a: A,
) => <Y, X, W, V, U, S, R, E, B>(
  kind: Kind9<F, Y, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind9<F, Y, X, W, V, U, S, R, E, B>
export function flap<F extends HKT10>(
  C: Covariant10<F>,
): <A>(
  a: A,
) => <Z, Y, X, W, V, U, S, R, E, B>(
  kind: Kind10<F, Z, Y, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind10<F, Z, Y, X, W, V, U, S, R, E, B>

export function flap<F extends HKT>(
  C: Covariant<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B> {
  return (a) => C.map((f) => f(a))
}
