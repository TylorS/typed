import { Chain, Chain2, Chain3, Chain3C, Chain4 } from 'fp-ts/dist/Chain'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { ProvideSome, ProvideSome2, ProvideSome3, ProvideSome3C, ProvideSome4 } from './Provide'
import { Provider, Provider2, Provider3, Provider4 } from './Provider'

export function provideSomeWith<F extends URIS2>(
  M: ProvideSome2<F> & Chain2<F>,
): <E, A>(provider: Kind2<F, E, A>) => Provider2<F, E, A>

export function provideSomeWith<F extends URIS3>(
  M: ProvideSome3<F> & Chain3<F>,
): <A, E, B>(provider: Kind3<F, A, E, B>) => Provider3<F, B, A, E>

export function provideSomeWith<F extends URIS3, E>(
  M: ProvideSome3C<F, E> & Chain3C<F, E>,
): <A, B>(provider: Kind3<F, A, E, B>) => Provider3<F, B, A, E>

export function provideSomeWith<F extends URIS4>(
  M: ProvideSome4<F> & Chain4<F>,
): <S, A, E, B>(provider: Kind4<F, S, A, E, B>) => Provider4<F, B, A, S, E>

export function provideSomeWith<F>(
  M: ProvideSome<F> & Chain<F>,
): <E1, A>(provider: HKT2<F, E1, A>) => Provider<F, E1, A>

export function provideSomeWith<F>(M: ProvideSome<F> & Chain<F>) {
  return <E, A>(provider: HKT2<F, E, A>) => <E2, B>(hkt: HKT2<F, E2, B>) =>
    pipe(
      provider,
      M.chain((e) => pipe(hkt, M.provideSome(e))),
    )
}
