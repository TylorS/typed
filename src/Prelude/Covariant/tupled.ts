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

export function tupled<F extends HKT>(
  C: Covariant<F>,
): <A>(kind: Kind<F, A>) => Kind<F, readonly [A]>
export function tupled<F extends HKT>(
  C: Covariant1<F>,
): <A>(kind: Kind<F, A>) => Kind<F, readonly [A]>
export function tupled<F extends HKT2>(
  C: Covariant2<F>,
): <E, A>(kind: Kind2<F, E, A>) => Kind2<F, E, readonly [A]>
export function tupled<F extends HKT3>(
  C: Covariant3<F>,
): <R, E, A>(kind: Kind3<F, R, E, A>) => Kind3<F, R, E, readonly [A]>
export function tupled<F extends HKT4>(
  C: Covariant4<F>,
): <S, R, E, A>(kind: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, readonly [A]>
export function tupled<F extends HKT5>(
  C: Covariant5<F>,
): <U, S, R, E, A>(kind: Kind5<F, U, S, R, E, A>) => Kind5<F, U, S, R, E, readonly [A]>
export function tupled<F extends HKT6>(
  C: Covariant6<F>,
): <V, U, S, R, E, A>(kind: Kind6<F, V, U, S, R, E, A>) => Kind6<F, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT7>(
  C: Covariant7<F>,
): <W, V, U, S, R, E, A>(
  kind: Kind7<F, W, V, U, S, R, E, A>,
) => Kind7<F, W, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT8>(
  C: Covariant8<F>,
): <X, W, V, U, S, R, E, A>(
  kind: Kind8<F, X, W, V, U, S, R, E, A>,
) => Kind8<F, X, W, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT9>(
  C: Covariant9<F>,
): <Y, X, W, V, U, S, R, E, A>(
  kind: Kind9<F, Y, X, W, V, U, S, R, E, A>,
) => Kind9<F, Y, X, W, V, U, S, R, E, readonly [A]>
export function tupled<F extends HKT10>(
  C: Covariant10<F>,
): <Z, Y, X, W, V, U, S, R, E, A>(
  kind: Kind10<F, Z, Y, X, W, V, U, S, R, E, A>,
) => Kind10<F, Z, Y, X, W, V, U, S, R, E, readonly [A]>

export function tupled<F extends HKT>(C: Covariant<F>) {
  return C.map(<A>(a: A) => [a] as const)
}
