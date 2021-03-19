import { WidenI } from '@typed/fp/Widen'
import { Chain, Chain2, Chain3, Chain3C, Chain4 } from 'fp-ts/dist/Chain'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4 } from './Provide'
import { Provider, Provider2, Provider3, Provider4 } from './Provider'

export function useSomeWith<F extends URIS2>(
  M: UseSome2<F> & Chain2<F>,
): <E, A>(provider: Kind2<F, E, A>) => Provider2<F, E, A>

export function useSomeWith<F extends URIS3>(
  M: UseSome3<F> & Chain3<F>,
): <A, E, B>(provider: Kind3<F, A, E, B>) => Provider3<F, B, A, E>

export function useSomeWith<F extends URIS3, E>(
  M: UseSome3C<F, E> & Chain3C<F, E>,
): <A, B>(provider: Kind3<F, A, E, B>) => Provider3<F, B, A, E>

export function useSomeWith<F extends URIS4>(
  M: UseSome4<F> & Chain4<F>,
): <S, A, E, B>(provider: Kind4<F, S, A, E, B>) => Provider4<F, B, A, S, E>

export function useSomeWith<F>(
  M: UseSome<F> & Chain<F>,
): <E, A>(provider: HKT2<F, E, A>) => Provider<F, E, A>

export function useSomeWith<F>(M: UseSome<F> & Chain<F>) {
  return <E1, A>(provider: HKT2<F, E1, A>) => <E2, B>(hkt: HKT2<F, WidenI<A | E2>, B>) =>
    pipe(
      provider,
      M.chain((e) => pipe(hkt, M.useSome(e))),
    )
}
