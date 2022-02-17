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
  Functor,
  Functor1,
  Functor2,
  Functor3,
  Functor4,
  Functor5,
  Functor6,
  Functor7,
  Functor8,
  Functor9,
  Functor10,
} from './Functor'

export function flap<F extends HKT>(
  F: Functor<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B>
export function flap<F extends HKT>(
  F: Functor1<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B>
export function flap<F extends HKT2>(
  F: Functor2<F>,
): <A>(a: A) => <E, B>(kind: Kind2<F, E, (a: A) => B>) => Kind2<F, E, B>
export function flap<F extends HKT3>(
  F: Functor3<F>,
): <A>(a: A) => <R, E, B>(kind: Kind3<F, R, E, (a: A) => B>) => Kind3<F, R, E, B>
export function flap<F extends HKT4>(
  F: Functor4<F>,
): <A>(a: A) => <S, R, E, B>(kind: Kind4<F, S, R, E, (a: A) => B>) => Kind4<F, S, R, E, B>
export function flap<F extends HKT5>(
  F: Functor5<F>,
): <A>(a: A) => <U, S, R, E, B>(kind: Kind5<F, U, S, R, E, (a: A) => B>) => Kind5<F, U, S, R, E, B>
export function flap<F extends HKT6>(
  F: Functor6<F>,
): <A>(
  a: A,
) => <V, U, S, R, E, B>(kind: Kind6<F, V, U, S, R, E, (a: A) => B>) => Kind6<F, V, U, S, R, E, B>
export function flap<F extends HKT7>(
  F: Functor7<F>,
): <A>(
  a: A,
) => <W, V, U, S, R, E, B>(
  kind: Kind7<F, W, V, U, S, R, E, (a: A) => B>,
) => Kind7<F, W, V, U, S, R, E, B>
export function flap<F extends HKT8>(
  F: Functor8<F>,
): <A>(
  a: A,
) => <X, W, V, U, S, R, E, B>(
  kind: Kind8<F, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind8<F, X, W, V, U, S, R, E, B>
export function flap<F extends HKT9>(
  F: Functor9<F>,
): <A>(
  a: A,
) => <Y, X, W, V, U, S, R, E, B>(
  kind: Kind9<F, Y, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind9<F, Y, X, W, V, U, S, R, E, B>
export function flap<F extends HKT10>(
  F: Functor10<F>,
): <A>(
  a: A,
) => <Z, Y, X, W, V, U, S, R, E, B>(
  kind: Kind10<F, Z, Y, X, W, V, U, S, R, E, (a: A) => B>,
) => Kind10<F, Z, Y, X, W, V, U, S, R, E, B>

export function flap<F extends HKT>(
  F: Functor<F>,
): <A>(a: A) => <B>(kind: Kind<F, (a: A) => B>) => Kind<F, B> {
  return (a) => F.map((f) => f(a))
}
