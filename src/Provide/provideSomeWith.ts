import { Chain, Chain3, Chain3C, Chain4 } from 'fp-ts/dist/Chain'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind3, Kind4, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { ProvideSome, ProvideSome3, ProvideSome3C, ProvideSome4, ProvideSome4C } from './Provide'
import { Provider3, Provider4 } from './Provider'

export function provideSomeWith<F extends URIS3>(
  M: ProvideSome3<F> & Chain3<F>,
): <A, E, B>(provider: Kind3<F, A, E, B>) => Provider3<F, B, A, E>

export function provideSomeWith<F extends URIS3, E>(
  M: ProvideSome3C<F, E> & Chain3C<F, E>,
): <A, B>(provider: Kind3<F, A, E, B>) => Provider3<F, B, A, E>

export function provideSomeWith<F extends URIS4>(
  M: ProvideSome4<F> & Chain4<F>,
): <S, A, E, B>(provider: Kind4<F, S, A, E, B>) => Provider4<F, B, A, S, E>

export function provideSomeWith<F extends URIS4, E>(
  M: ProvideSome4C<F, E> & Chain4<F>,
): <S, A, B>(provider: Kind4<F, S, A, E, B>) => Provider4<F, B, A, S, E>

export function provideSomeWith<F>(
  M: ProvideSome<F> & Chain<F>,
): <A>(provider: HKT<F, A>) => <B>(hkt: HKT<F, B>) => HKT<F, B>

export function provideSomeWith<F>(M: ProvideSome<F> & Chain<F>) {
  return <A>(provider: HKT<F, A>) => <B>(hkt: HKT<F, B>): HKT<F, B> =>
    pipe(
      provider,
      M.chain((e) => pipe(hkt, M.provideSome(e))),
    )
}
