import { Unary } from '@/function'
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
} from '@/HKT'

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

export function map<F extends HKT, G extends HKT>(
  F: Functor<F>,
  G: Functor<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>
export function map<F extends HKT, G extends HKT>(
  F: Functor1<F>,
  G: Functor<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>
export function map<F extends HKT2, G extends HKT>(
  F: Functor2<F>,
  G: Functor<G>,
): <A, B>(f: Unary<A, B>) => <E1>(kind: Kind2<F, E1, Kind<G, A>>) => Kind2<F, E1, Kind<G, B>>
export function map<F extends HKT3, G extends HKT>(
  F: Functor3<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1>(kind: Kind3<F, R1, E1, Kind<G, A>>) => Kind3<F, R1, E1, Kind<G, B>>
export function map<F extends HKT4, G extends HKT>(
  F: Functor4<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1>(kind: Kind4<F, S1, R1, E1, Kind<G, A>>) => Kind4<F, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT5, G extends HKT>(
  F: Functor5<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1>(
  kind: Kind5<F, U1, S1, R1, E1, Kind<G, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT6, G extends HKT>(
  F: Functor6<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT7, G extends HKT>(
  F: Functor7<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT8, G extends HKT>(
  F: Functor8<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT9, G extends HKT>(
  F: Functor9<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT10, G extends HKT>(
  F: Functor10<F>,
  G: Functor<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT, G extends HKT>(
  F: Functor<F>,
  G: Functor1<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>
export function map<F extends HKT, G extends HKT>(
  F: Functor1<F>,
  G: Functor1<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>
export function map<F extends HKT2, G extends HKT>(
  F: Functor2<F>,
  G: Functor1<G>,
): <A, B>(f: Unary<A, B>) => <E1>(kind: Kind2<F, E1, Kind<G, A>>) => Kind2<F, E1, Kind<G, B>>
export function map<F extends HKT3, G extends HKT>(
  F: Functor3<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1>(kind: Kind3<F, R1, E1, Kind<G, A>>) => Kind3<F, R1, E1, Kind<G, B>>
export function map<F extends HKT4, G extends HKT>(
  F: Functor4<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1>(kind: Kind4<F, S1, R1, E1, Kind<G, A>>) => Kind4<F, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT5, G extends HKT>(
  F: Functor5<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1>(
  kind: Kind5<F, U1, S1, R1, E1, Kind<G, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT6, G extends HKT>(
  F: Functor6<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT7, G extends HKT>(
  F: Functor7<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT8, G extends HKT>(
  F: Functor8<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT9, G extends HKT>(
  F: Functor9<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT10, G extends HKT>(
  F: Functor10<F>,
  G: Functor1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>
export function map<F extends HKT, G extends HKT2>(
  F: Functor<F>,
  G: Functor2<G>,
): <A, B>(f: Unary<A, B>) => <E2>(kind: Kind<F, Kind2<G, E2, A>>) => Kind<F, Kind2<G, E2, B>>
export function map<F extends HKT, G extends HKT2>(
  F: Functor1<F>,
  G: Functor2<G>,
): <A, B>(f: Unary<A, B>) => <E2>(kind: Kind<F, Kind2<G, E2, A>>) => Kind<F, Kind2<G, E2, B>>
export function map<F extends HKT2, G extends HKT2>(
  F: Functor2<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, E2>(kind: Kind2<F, E1, Kind2<G, E2, A>>) => Kind2<F, E1, Kind2<G, E2, B>>
export function map<F extends HKT3, G extends HKT2>(
  F: Functor3<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, E2>(kind: Kind3<F, R1, E1, Kind2<G, E2, A>>) => Kind3<F, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT4, G extends HKT2>(
  F: Functor4<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, E2>(
  kind: Kind4<F, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT5, G extends HKT2>(
  F: Functor5<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT6, G extends HKT2>(
  F: Functor6<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT7, G extends HKT2>(
  F: Functor7<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT8, G extends HKT2>(
  F: Functor8<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT9, G extends HKT2>(
  F: Functor9<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT10, G extends HKT2>(
  F: Functor10<F>,
  G: Functor2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>
export function map<F extends HKT, G extends HKT3>(
  F: Functor<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R2, E2>(kind: Kind<F, Kind3<G, R2, E2, A>>) => Kind<F, Kind3<G, R2, E2, B>>
export function map<F extends HKT, G extends HKT3>(
  F: Functor1<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R2, E2>(kind: Kind<F, Kind3<G, R2, E2, A>>) => Kind<F, Kind3<G, R2, E2, B>>
export function map<F extends HKT2, G extends HKT3>(
  F: Functor2<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, R2, E2>(kind: Kind2<F, E1, Kind3<G, R2, E2, A>>) => Kind2<F, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT3, G extends HKT3>(
  F: Functor3<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, R2, E2>(
  kind: Kind3<F, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT4, G extends HKT3>(
  F: Functor4<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT5, G extends HKT3>(
  F: Functor5<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT6, G extends HKT3>(
  F: Functor6<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT7, G extends HKT3>(
  F: Functor7<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT8, G extends HKT3>(
  F: Functor8<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT9, G extends HKT3>(
  F: Functor9<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT10, G extends HKT3>(
  F: Functor10<F>,
  G: Functor3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>
export function map<F extends HKT, G extends HKT4>(
  F: Functor<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S2, R2, E2>(kind: Kind<F, Kind4<G, S2, R2, E2, A>>) => Kind<F, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT4>(
  F: Functor1<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S2, R2, E2>(kind: Kind<F, Kind4<G, S2, R2, E2, A>>) => Kind<F, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT4>(
  F: Functor2<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, S2, R2, E2>(
  kind: Kind2<F, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT4>(
  F: Functor3<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT4>(
  F: Functor4<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT4>(
  F: Functor5<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT4>(
  F: Functor6<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT4>(
  F: Functor7<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT4>(
  F: Functor8<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT4>(
  F: Functor9<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT4>(
  F: Functor10<F>,
  G: Functor4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT5>(
  F: Functor<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U2, S2, R2, E2>(
  kind: Kind<F, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind<F, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT5>(
  F: Functor1<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U2, S2, R2, E2>(
  kind: Kind<F, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind<F, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT5>(
  F: Functor2<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT5>(
  F: Functor3<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT5>(
  F: Functor4<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT5>(
  F: Functor5<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT5>(
  F: Functor6<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT5>(
  F: Functor7<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT5>(
  F: Functor8<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT5>(
  F: Functor9<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT5>(
  F: Functor10<F>,
  G: Functor5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT6>(
  F: Functor<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT6>(
  F: Functor1<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT6>(
  F: Functor2<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT6>(
  F: Functor3<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT6>(
  F: Functor4<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT6>(
  F: Functor5<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT6>(
  F: Functor6<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT6>(
  F: Functor7<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT6>(
  F: Functor8<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT6>(
  F: Functor9<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT6>(
  F: Functor10<F>,
  G: Functor6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT7>(
  F: Functor<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT7>(
  F: Functor1<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT7>(
  F: Functor2<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT7>(
  F: Functor3<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT7>(
  F: Functor4<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT7>(
  F: Functor5<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT7>(
  F: Functor6<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT7>(
  F: Functor7<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT7>(
  F: Functor8<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT7>(
  F: Functor9<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT7>(
  F: Functor10<F>,
  G: Functor7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT8>(
  F: Functor<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT8>(
  F: Functor1<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT8>(
  F: Functor2<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT8>(
  F: Functor3<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT8>(
  F: Functor4<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT8>(
  F: Functor5<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT8>(
  F: Functor6<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT8>(
  F: Functor7<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT8>(
  F: Functor8<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT8>(
  F: Functor9<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT8>(
  F: Functor10<F>,
  G: Functor8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT9>(
  F: Functor<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT9>(
  F: Functor1<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT9>(
  F: Functor2<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT9>(
  F: Functor3<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT9>(
  F: Functor4<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT9>(
  F: Functor5<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT9>(
  F: Functor6<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT9>(
  F: Functor7<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT9>(
  F: Functor8<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT9>(
  F: Functor9<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT9>(
  F: Functor10<F>,
  G: Functor9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT10>(
  F: Functor<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT, G extends HKT10>(
  F: Functor1<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT2, G extends HKT10>(
  F: Functor2<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT3, G extends HKT10>(
  F: Functor3<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT4, G extends HKT10>(
  F: Functor4<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT5, G extends HKT10>(
  F: Functor5<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT6, G extends HKT10>(
  F: Functor6<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT7, G extends HKT10>(
  F: Functor7<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT8, G extends HKT10>(
  F: Functor8<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT9, G extends HKT10>(
  F: Functor9<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>
export function map<F extends HKT10, G extends HKT10>(
  F: Functor10<F>,
  G: Functor10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<
    F,
    Z1,
    Y1,
    X1,
    W1,
    V1,
    U1,
    S1,
    R1,
    E1,
    Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>
  >,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT>(F: Functor<F>, G: Functor<G>) {
  return <A, B>(f: Unary<A, B>) =>
    (fa: Kind<F, Kind<G, A>>): Kind<F, Kind<G, B>> =>
      F.map(G.map(f))(fa)
}
