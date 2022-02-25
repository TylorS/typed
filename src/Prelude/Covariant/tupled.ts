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

export function tupled<T extends HKT10>(
  C: Covariant10<T>,
): <Z, Y, X, W, V, U, S, R, E, A>(
  kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, A>,
) => Kind10<T, Z, Y, X, W, V, U, S, R, E, readonly [A]>

export function tupled<T extends HKT9>(
  C: Covariant9<T>,
): <Y, X, W, V, U, S, R, E, A>(
  kind: Kind9<T, Y, X, W, V, U, S, R, E, A>,
) => Kind9<T, Y, X, W, V, U, S, R, E, readonly [A]>

export function tupled<T extends HKT8>(
  C: Covariant8<T>,
): <X, W, V, U, S, R, E, A>(
  kind: Kind8<T, X, W, V, U, S, R, E, A>,
) => Kind8<T, X, W, V, U, S, R, E, readonly [A]>

export function tupled<T extends HKT7>(
  C: Covariant7<T>,
): <W, V, U, S, R, E, A>(
  kind: Kind7<T, W, V, U, S, R, E, A>,
) => Kind7<T, W, V, U, S, R, E, readonly [A]>

export function tupled<T extends HKT6>(
  C: Covariant6<T>,
): <V, U, S, R, E, A>(kind: Kind6<T, V, U, S, R, E, A>) => Kind6<T, V, U, S, R, E, readonly [A]>

export function tupled<T extends HKT5>(
  C: Covariant5<T>,
): <U, S, R, E, A>(kind: Kind5<T, U, S, R, E, A>) => Kind5<T, U, S, R, E, readonly [A]>

export function tupled<T extends HKT4>(
  C: Covariant4<T>,
): <S, R, E, A>(kind: Kind4<T, S, R, E, A>) => Kind4<T, S, R, E, readonly [A]>

export function tupled<T extends HKT3>(
  C: Covariant3<T>,
): <R, E, A>(kind: Kind3<T, R, E, A>) => Kind3<T, R, E, readonly [A]>

export function tupled<T extends HKT2>(
  C: Covariant2<T>,
): <E, A>(kind: Kind2<T, E, A>) => Kind2<T, E, readonly [A]>

export function tupled<T extends HKT>(
  C: Covariant1<T>,
): <A>(kind: Kind<T, A>) => Kind<T, readonly [A]>

export function tupled<T extends HKT>(
  C: Covariant<T>,
): <A>(kind: Kind<T, A>) => Kind<T, readonly [A]>

export function tupled<F extends HKT>(C: Covariant<F>) {
  return C.map(<A>(a: A) => [a] as const)
}
