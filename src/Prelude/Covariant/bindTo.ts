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

export function bindTo<T extends HKT10>(
  C: Covariant10<T>,
): <N extends string>(
  name: N,
) => <Z, Y, X, W, V, U, S, R, E, A>(
  kind: Kind10<T, Z, Y, X, W, V, U, S, R, E, A>,
) => Kind10<
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
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT9>(
  C: Covariant9<T>,
): <N extends string>(
  name: N,
) => <Y, X, W, V, U, S, R, E, A>(
  kind: Kind9<T, Y, X, W, V, U, S, R, E, A>,
) => Kind9<
  T,
  Y,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT8>(
  C: Covariant8<T>,
): <N extends string>(
  name: N,
) => <X, W, V, U, S, R, E, A>(
  kind: Kind8<T, X, W, V, U, S, R, E, A>,
) => Kind8<
  T,
  X,
  W,
  V,
  U,
  S,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT7>(
  C: Covariant7<T>,
): <N extends string>(
  name: N,
) => <W, V, U, S, R, E, A>(
  kind: Kind7<T, W, V, U, S, R, E, A>,
) => Kind7<
  T,
  W,
  V,
  U,
  S,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT6>(
  C: Covariant6<T>,
): <N extends string>(
  name: N,
) => <V, U, S, R, E, A>(
  kind: Kind6<T, V, U, S, R, E, A>,
) => Kind6<
  T,
  V,
  U,
  S,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT5>(
  C: Covariant5<T>,
): <N extends string>(
  name: N,
) => <U, S, R, E, A>(
  kind: Kind5<T, U, S, R, E, A>,
) => Kind5<
  T,
  U,
  S,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT4>(
  C: Covariant4<T>,
): <N extends string>(
  name: N,
) => <S, R, E, A>(
  kind: Kind4<T, S, R, E, A>,
) => Kind4<
  T,
  S,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT3>(
  C: Covariant3<T>,
): <N extends string>(
  name: N,
) => <R, E, A>(
  kind: Kind3<T, R, E, A>,
) => Kind3<
  T,
  R,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT2>(
  C: Covariant2<T>,
): <N extends string>(
  name: N,
) => <E, A>(
  kind: Kind2<T, E, A>,
) => Kind2<
  T,
  E,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT>(
  C: Covariant1<T>,
): <N extends string>(
  name: N,
) => <A>(kind: Kind<T, A>) => Kind<
  T,
  {
    readonly [K in N]: A
  }
>

export function bindTo<T extends HKT>(
  C: Covariant<T>,
): <N extends string>(
  name: N,
) => <A>(kind: Kind<T, A>) => Kind<
  T,
  {
    readonly [K in N]: A
  }
>

export function bindTo<F extends HKT>(
  C: Covariant<F>,
): <N extends string>(name: N) => <A>(fa: Kind<F, A>) => Kind<F, { readonly [K in N]: A }> {
  return (name) => C.map((a) => ({ [name]: a } as any))
}
