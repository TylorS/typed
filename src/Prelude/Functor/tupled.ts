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
} from '../HKT'
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

export function tupled<F extends HKT>(F: Functor<F>): <A>(kind: Kind<F, A>) => Kind<F, readonly [A]>
export function tupled<F extends HKT>(
  F: Functor1<F>,
): <A>(kind: Kind<F, A>) => Kind<F, readonly [A]>
export function tupled<F extends HKT2>(
  F: Functor2<F>,
): <E, A>(kind: Kind2<F, E, A>) => Kind2<F, E, readonly [A]>
export function tupled<F extends HKT3>(
  F: Functor3<F>,
): <R, E, A>(kind: Kind3<F, R, E, A>) => Kind3<F, R, E, readonly [A]>
export function tupled<F extends HKT4>(
  F: Functor4<F>,
): <S, R, E, A>(kind: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, readonly [A]>
export function tupled<F extends HKT5>(
  F: Functor5<F>,
): <U, S, R, E, A>(kind: Kind5<F, U, S, R, E, A>) => Kind5<F, U, S, R, E, readonly [A]>
export function tupled<F extends HKT6>(
  F: Functor6<F>,
): <V, U, S, R, E, A>(kind: Kind6<F, V, U, S, R, E, A>) => Kind6<F, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT7>(
  F: Functor7<F>,
): <W, V, U, S, R, E, A>(
  kind: Kind7<F, W, V, U, S, R, E, A>,
) => Kind7<F, W, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT8>(
  F: Functor8<F>,
): <X, W, V, U, S, R, E, A>(
  kind: Kind8<F, X, W, V, U, S, R, E, A>,
) => Kind8<F, X, W, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT9>(
  F: Functor9<F>,
): <Y, X, W, V, U, S, R, E, A>(
  kind: Kind9<F, Y, X, W, V, U, S, R, E, A>,
) => Kind9<F, Y, X, W, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT10>(
  F: Functor10<F>,
): <Z, Y, X, W, V, U, S, R, E, A>(
  kind: Kind10<F, Z, Y, X, W, V, U, S, R, E, A>,
) => Kind10<F, Z, Y, X, W, V, U, S, R, E, readonly [A]>

export function tupled<F extends HKT>(F: Functor<F>) {
  return F.map(<A>(a: A) => [a] as const)
}
