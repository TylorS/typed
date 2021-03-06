import { WidenI } from '@typed/fp/Widen'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export type Provider<F> = <B>(hkt: HKT<F, B>) => HKT<F, B>

export type Provider2<F extends URIS2, A, B> = <C, D>(
  kind: Kind2<F, WidenI<A | C>, D>,
) => Kind2<F, WidenI<B | C>, D>

export type Provider3<F extends URIS3, A, B, E> = <C, D>(
  kind: Kind3<F, WidenI<A | C>, E, D>,
) => Kind3<F, WidenI<B | C>, E, D>

export type Provider4<F extends URIS4, A, B, S, E> = <C, D>(
  kind: Kind4<F, S, WidenI<A | C>, E, D>,
) => Kind4<F, S, WidenI<B | C>, E, D>
