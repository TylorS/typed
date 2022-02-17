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

export function bindTo<F extends HKT>(
  F: Functor<F>,
): <N extends string>(name: N) => <A>(kind: Kind<F, A>) => Kind<F, { readonly [K in N]: A }>
export function bindTo<F extends HKT>(
  F: Functor1<F>,
): <N extends string>(name: N) => <A>(kind: Kind<F, A>) => Kind<F, { readonly [K in N]: A }>
export function bindTo<F extends HKT2>(
  F: Functor2<F>,
): <N extends string>(
  name: N,
) => <E, A>(kind: Kind2<F, E, A>) => Kind2<F, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT3>(
  F: Functor3<F>,
): <N extends string>(
  name: N,
) => <R, E, A>(kind: Kind3<F, R, E, A>) => Kind3<F, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT4>(
  F: Functor4<F>,
): <N extends string>(
  name: N,
) => <S, R, E, A>(kind: Kind4<F, S, R, E, A>) => Kind4<F, S, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT5>(
  F: Functor5<F>,
): <N extends string>(
  name: N,
) => <U, S, R, E, A>(
  kind: Kind5<F, U, S, R, E, A>,
) => Kind5<F, U, S, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT6>(
  F: Functor6<F>,
): <N extends string>(
  name: N,
) => <V, U, S, R, E, A>(
  kind: Kind6<F, V, U, S, R, E, A>,
) => Kind6<F, V, U, S, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT7>(
  F: Functor7<F>,
): <N extends string>(
  name: N,
) => <W, V, U, S, R, E, A>(
  kind: Kind7<F, W, V, U, S, R, E, A>,
) => Kind7<F, W, V, U, S, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT8>(
  F: Functor8<F>,
): <N extends string>(
  name: N,
) => <X, W, V, U, S, R, E, A>(
  kind: Kind8<F, X, W, V, U, S, R, E, A>,
) => Kind8<F, X, W, V, U, S, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT9>(
  F: Functor9<F>,
): <N extends string>(
  name: N,
) => <Y, X, W, V, U, S, R, E, A>(
  kind: Kind9<F, Y, X, W, V, U, S, R, E, A>,
) => Kind9<F, Y, X, W, V, U, S, R, E, { readonly [K in N]: A }>
export function bindTo<F extends HKT10>(
  F: Functor10<F>,
): <N extends string>(
  name: N,
) => <Z, Y, X, W, V, U, S, R, E, A>(
  kind: Kind10<F, Z, Y, X, W, V, U, S, R, E, A>,
) => Kind10<F, Z, Y, X, W, V, U, S, R, E, { readonly [K in N]: A }>

export function bindTo<F extends HKT>(
  F: Functor<F>,
): <N extends string>(name: N) => <A>(fa: Kind<F, A>) => Kind<F, { readonly [K in N]: A }> {
  return (name) => F.map((a) => ({ [name]: a } as any))
}
