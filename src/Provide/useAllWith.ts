import { Chain, Chain2, Chain3, Chain4 } from 'fp-ts/dist/Chain'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { UseAll, UseAll2, UseAll3, UseAll4 } from './Provide'

export function useAllWith<F extends URIS2>(
  M: UseAll2<F> & Chain2<F>,
): <A, B>(provider: Kind2<F, A, B>) => <C>(kind: Kind2<F, B, C>) => Kind2<F, A, C>

export function useAllWith<F extends URIS3>(
  M: UseAll3<F> & Chain3<F>,
): <A, B, C>(provider: Kind3<F, A, B, C>) => <D>(kind: Kind3<F, C, B, D>) => Kind3<F, A, B, D>

export function useAllWith<F extends URIS4>(
  M: UseAll4<F> & Chain4<F>,
): <A, B, C, D>(
  provider: Kind4<F, A, B, C, D>,
) => <E>(kind: Kind4<F, A, D, C, E>) => Kind4<F, A, B, C, E>

export function useAllWith<F>(
  M: UseAll<F> & Chain<F>,
): <E, A>(provider: HKT2<F, E, A>) => <B>(hkt: HKT2<F, A, B>) => HKT2<F, E, B>

export function useAllWith<F>(M: UseAll<F> & Chain<F>) {
  return <E, A>(provider: HKT2<F, E, A>) => <B>(hkt: HKT2<F, A, B>) =>
    pipe(
      provider,
      M.chain((e) => pipe(hkt, M.useAll(e))),
    )
}
