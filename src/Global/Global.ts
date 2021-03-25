import { CurrentID, ID, usingID } from '@typed/fp/ID'
import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4 } from '@typed/fp/Provide'
import { WidenI } from '@typed/fp/Widen'
import { Functor, Functor2, Functor3, Functor3C, Functor4 } from 'fp-ts/dist/Functor'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

/**
 * A dedicated namespace to work as a "global" namespace within a given runtime context.
 */
export const GlobalID = ID(Symbol.for('@typed/fp/Global'))

export function usingGlobal<F extends URIS2>(
  M: UseSome2<F> & Functor2<F>,
): {
  <E, A>(hkt: Kind2<F, WidenI<E | CurrentID>, A>): Kind2<F, E, A>
  <A>(hkt: Kind2<F, CurrentID, A>): Kind2<F, never, A>
}

export function usingGlobal<F extends URIS3>(
  M: UseSome3<F> & Functor3<F>,
): {
  <R, E, A>(hkt: Kind3<F, WidenI<R | CurrentID>, E, A>): Kind3<F, R, E, A>
  <E, A>(hkt: Kind3<F, CurrentID, E, A>): Kind3<F, never, E, A>
}

export function usingGlobal<F extends URIS3, E>(
  M: UseSome3C<F, E> & Functor3C<F, E>,
): {
  <R, A>(hkt: Kind3<F, WidenI<R | CurrentID>, E, A>): Kind3<F, R, E, A>
  <A>(hkt: Kind3<F, CurrentID, E, A>): Kind3<F, never, E, A>
}

export function usingGlobal<F extends URIS4>(
  M: UseSome4<F> & Functor4<F>,
): {
  <S, R, E, A>(hkt: Kind4<F, S, WidenI<R | CurrentID>, E, A>): Kind4<F, S, R, E, A>
  <S, E, A>(hkt: Kind4<F, S, CurrentID, E, A>): Kind4<F, S, never, E, A>
}

export function usingGlobal<F>(
  M: UseSome<F> & Functor<F>,
): <E, A>(hkt: HKT2<F, WidenI<E | CurrentID>, A>) => HKT2<F, E, A>

export function usingGlobal<F>(M: UseSome<F> & Functor<F>) {
  return usingID(M)(GlobalID)
}
