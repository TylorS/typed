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

export function map<F extends HKT10, G extends HKT10>(
  F: Covariant10<F>,
  G: Covariant10<G>,
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

export function map<F extends HKT9, G extends HKT10>(
  F: Covariant9<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT10>(
  F: Covariant8<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT10>(
  F: Covariant7<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT10>(
  F: Covariant6<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT10>(
  F: Covariant5<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT10>(
  F: Covariant4<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT10>(
  F: Covariant3<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT10>(
  F: Covariant2<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT10>(
  F: Covariant1<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT10>(
  F: Covariant<F>,
  G: Covariant10<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z2, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind10<G, Z2, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT9>(
  F: Covariant10<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT9, G extends HKT9>(
  F: Covariant9<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT9>(
  F: Covariant8<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT9>(
  F: Covariant7<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT9>(
  F: Covariant6<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT9>(
  F: Covariant5<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT9>(
  F: Covariant4<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT9>(
  F: Covariant3<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT9>(
  F: Covariant2<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT9>(
  F: Covariant1<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT9>(
  F: Covariant<F>,
  G: Covariant9<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y2, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind9<G, Y2, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT8>(
  F: Covariant10<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT9, G extends HKT8>(
  F: Covariant9<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT8>(
  F: Covariant8<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT8>(
  F: Covariant7<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT8>(
  F: Covariant6<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT8>(
  F: Covariant5<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT8>(
  F: Covariant4<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT8>(
  F: Covariant3<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT8>(
  F: Covariant2<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT8>(
  F: Covariant1<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT8>(
  F: Covariant<F>,
  G: Covariant8<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X2, W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind8<G, X2, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT7>(
  F: Covariant10<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT9, G extends HKT7>(
  F: Covariant9<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT7>(
  F: Covariant8<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT7>(
  F: Covariant7<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT7>(
  F: Covariant6<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT7>(
  F: Covariant5<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT7>(
  F: Covariant4<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT7>(
  F: Covariant3<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT7>(
  F: Covariant2<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, W2, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT7>(
  F: Covariant1<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT7>(
  F: Covariant<F>,
  G: Covariant7<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W2, V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind7<G, W2, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT6>(
  F: Covariant10<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT9, G extends HKT6>(
  F: Covariant9<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT6>(
  F: Covariant8<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT6>(
  F: Covariant7<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT6>(
  F: Covariant6<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT6>(
  F: Covariant5<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT6>(
  F: Covariant4<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT6>(
  F: Covariant3<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, V2, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT6>(
  F: Covariant2<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, V2, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT6>(
  F: Covariant1<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT6>(
  F: Covariant<F>,
  G: Covariant6<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V2, U2, S2, R2, E2>(
  kind: Kind<F, Kind6<G, V2, U2, S2, R2, E2, A>>,
) => Kind<F, Kind6<G, V2, U2, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT5>(
  F: Covariant10<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT9, G extends HKT5>(
  F: Covariant9<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT5>(
  F: Covariant8<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT5>(
  F: Covariant7<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT5>(
  F: Covariant6<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT5>(
  F: Covariant5<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT5>(
  F: Covariant4<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, U2, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT5>(
  F: Covariant3<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, U2, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT5>(
  F: Covariant2<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, U2, S2, R2, E2>(
  kind: Kind2<F, E1, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT5>(
  F: Covariant1<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U2, S2, R2, E2>(
  kind: Kind<F, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind<F, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT5>(
  F: Covariant<F>,
  G: Covariant5<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U2, S2, R2, E2>(
  kind: Kind<F, Kind5<G, U2, S2, R2, E2, A>>,
) => Kind<F, Kind5<G, U2, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT4>(
  F: Covariant10<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT9, G extends HKT4>(
  F: Covariant9<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT8, G extends HKT4>(
  F: Covariant8<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT7, G extends HKT4>(
  F: Covariant7<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT6, G extends HKT4>(
  F: Covariant6<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT5, G extends HKT4>(
  F: Covariant5<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, S2, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT4, G extends HKT4>(
  F: Covariant4<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, S2, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT3, G extends HKT4>(
  F: Covariant3<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, S2, R2, E2>(
  kind: Kind3<F, R1, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT2, G extends HKT4>(
  F: Covariant2<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, S2, R2, E2>(
  kind: Kind2<F, E1, Kind4<G, S2, R2, E2, A>>,
) => Kind2<F, E1, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT4>(
  F: Covariant1<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S2, R2, E2>(kind: Kind<F, Kind4<G, S2, R2, E2, A>>) => Kind<F, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT, G extends HKT4>(
  F: Covariant<F>,
  G: Covariant4<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S2, R2, E2>(kind: Kind<F, Kind4<G, S2, R2, E2, A>>) => Kind<F, Kind4<G, S2, R2, E2, B>>

export function map<F extends HKT10, G extends HKT3>(
  F: Covariant10<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT9, G extends HKT3>(
  F: Covariant9<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT8, G extends HKT3>(
  F: Covariant8<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT7, G extends HKT3>(
  F: Covariant7<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT6, G extends HKT3>(
  F: Covariant6<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, R2, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT5, G extends HKT3>(
  F: Covariant5<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, R2, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT4, G extends HKT3>(
  F: Covariant4<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, R2, E2>(
  kind: Kind4<F, S1, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT3, G extends HKT3>(
  F: Covariant3<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, R2, E2>(
  kind: Kind3<F, R1, E1, Kind3<G, R2, E2, A>>,
) => Kind3<F, R1, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT2, G extends HKT3>(
  F: Covariant2<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, R2, E2>(kind: Kind2<F, E1, Kind3<G, R2, E2, A>>) => Kind2<F, E1, Kind3<G, R2, E2, B>>

export function map<F extends HKT, G extends HKT3>(
  F: Covariant1<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R2, E2>(kind: Kind<F, Kind3<G, R2, E2, A>>) => Kind<F, Kind3<G, R2, E2, B>>

export function map<F extends HKT, G extends HKT3>(
  F: Covariant<F>,
  G: Covariant3<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R2, E2>(kind: Kind<F, Kind3<G, R2, E2, A>>) => Kind<F, Kind3<G, R2, E2, B>>

export function map<F extends HKT10, G extends HKT2>(
  F: Covariant10<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT9, G extends HKT2>(
  F: Covariant9<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT8, G extends HKT2>(
  F: Covariant8<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT7, G extends HKT2>(
  F: Covariant7<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1, E2>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT6, G extends HKT2>(
  F: Covariant6<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1, E2>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT5, G extends HKT2>(
  F: Covariant5<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1, E2>(
  kind: Kind5<F, U1, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT4, G extends HKT2>(
  F: Covariant4<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1, E2>(
  kind: Kind4<F, S1, R1, E1, Kind2<G, E2, A>>,
) => Kind4<F, S1, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT3, G extends HKT2>(
  F: Covariant3<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1, E2>(kind: Kind3<F, R1, E1, Kind2<G, E2, A>>) => Kind3<F, R1, E1, Kind2<G, E2, B>>

export function map<F extends HKT2, G extends HKT2>(
  F: Covariant2<F>,
  G: Covariant2<G>,
): <A, B>(
  f: Unary<A, B>,
) => <E1, E2>(kind: Kind2<F, E1, Kind2<G, E2, A>>) => Kind2<F, E1, Kind2<G, E2, B>>

export function map<F extends HKT, G extends HKT2>(
  F: Covariant1<F>,
  G: Covariant2<G>,
): <A, B>(f: Unary<A, B>) => <E2>(kind: Kind<F, Kind2<G, E2, A>>) => Kind<F, Kind2<G, E2, B>>

export function map<F extends HKT, G extends HKT2>(
  F: Covariant<F>,
  G: Covariant2<G>,
): <A, B>(f: Unary<A, B>) => <E2>(kind: Kind<F, Kind2<G, E2, A>>) => Kind<F, Kind2<G, E2, B>>

export function map<F extends HKT10, G extends HKT>(
  F: Covariant10<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT9, G extends HKT>(
  F: Covariant9<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT8, G extends HKT>(
  F: Covariant8<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT7, G extends HKT>(
  F: Covariant7<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT6, G extends HKT>(
  F: Covariant6<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT5, G extends HKT>(
  F: Covariant5<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1>(
  kind: Kind5<F, U1, S1, R1, E1, Kind<G, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT4, G extends HKT>(
  F: Covariant4<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1>(kind: Kind4<F, S1, R1, E1, Kind<G, A>>) => Kind4<F, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT3, G extends HKT>(
  F: Covariant3<F>,
  G: Covariant1<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1>(kind: Kind3<F, R1, E1, Kind<G, A>>) => Kind3<F, R1, E1, Kind<G, B>>

export function map<F extends HKT2, G extends HKT>(
  F: Covariant2<F>,
  G: Covariant1<G>,
): <A, B>(f: Unary<A, B>) => <E1>(kind: Kind2<F, E1, Kind<G, A>>) => Kind2<F, E1, Kind<G, B>>

export function map<F extends HKT, G extends HKT>(
  F: Covariant1<F>,
  G: Covariant1<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>

export function map<F extends HKT, G extends HKT>(
  F: Covariant<F>,
  G: Covariant1<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>

export function map<F extends HKT10, G extends HKT>(
  F: Covariant10<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Z1, Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind10<F, Z1, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT9, G extends HKT>(
  F: Covariant9<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <Y1, X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind9<F, Y1, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT8, G extends HKT>(
  F: Covariant8<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <X1, W1, V1, U1, S1, R1, E1>(
  kind: Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind8<F, X1, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT7, G extends HKT>(
  F: Covariant7<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <W1, V1, U1, S1, R1, E1>(
  kind: Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind7<F, W1, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT6, G extends HKT>(
  F: Covariant6<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <V1, U1, S1, R1, E1>(
  kind: Kind6<F, V1, U1, S1, R1, E1, Kind<G, A>>,
) => Kind6<F, V1, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT5, G extends HKT>(
  F: Covariant5<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <U1, S1, R1, E1>(
  kind: Kind5<F, U1, S1, R1, E1, Kind<G, A>>,
) => Kind5<F, U1, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT4, G extends HKT>(
  F: Covariant4<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <S1, R1, E1>(kind: Kind4<F, S1, R1, E1, Kind<G, A>>) => Kind4<F, S1, R1, E1, Kind<G, B>>

export function map<F extends HKT3, G extends HKT>(
  F: Covariant3<F>,
  G: Covariant<G>,
): <A, B>(
  f: Unary<A, B>,
) => <R1, E1>(kind: Kind3<F, R1, E1, Kind<G, A>>) => Kind3<F, R1, E1, Kind<G, B>>

export function map<F extends HKT2, G extends HKT>(
  F: Covariant2<F>,
  G: Covariant<G>,
): <A, B>(f: Unary<A, B>) => <E1>(kind: Kind2<F, E1, Kind<G, A>>) => Kind2<F, E1, Kind<G, B>>

export function map<F extends HKT, G extends HKT>(
  F: Covariant1<F>,
  G: Covariant<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>

export function map<F extends HKT, G extends HKT>(
  F: Covariant<F>,
  G: Covariant<G>,
): <A, B>(f: Unary<A, B>) => (kind: Kind<F, Kind<G, A>>) => Kind<F, Kind<G, B>>

export function map<F extends HKT, G extends HKT>(F: Covariant<F>, G: Covariant<G>) {
  return <A, B>(f: Unary<A, B>) =>
    (fa: Kind<F, Kind<G, A>>): Kind<F, Kind<G, B>> =>
      F.map(G.map(f))(fa)
}
