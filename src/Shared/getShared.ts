import { Ask, Ask2, Ask3, Ask3C } from '@typed/fp/Ask'
import { IntersectionWiden, Widen, WideningOptions } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { Monad, Monad2, Monad3 } from 'fp-ts/dist/Monad'

import { Shared, Shared2, Shared3 } from './Shared'

export interface GetShared<F> {
  readonly getShared: <K, A>(shared: Shared<F, K, A>) => HKT<F, A>
}

export interface GetShared2<F extends URIS2> {
  readonly getShared: <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, E, A>
}

export interface GetShared3<F extends URIS3> {
  readonly getShared: <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface GetShared3C<F extends URIS3, E> {
  readonly getShared: <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export function getShared<F extends URIS2, W extends WideningOptions = IntersectionWiden>(
  M: Monad2<F> & Ask2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, Widen<E | GetShared2<F>, W[2]>, A>

export function getShared<F extends URIS3, W extends WideningOptions = IntersectionWiden>(
  M: Monad3<F> & Ask3<F>,
): <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, Widen<E | GetShared3<F>, W[2]>, A>

export function getShared<F extends URIS3, E, W extends WideningOptions = IntersectionWiden>(
  M: Monad3<F> & Ask3C<F, E>,
): <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, Widen<R | GetShared3<F>, W[3]>, E, A>

export function getShared<F>(M: Monad<F> & Ask<F>): <K, A>(shared: Shared<F, K, A>) => HKT<F, A>

export function getShared<F>(M: Monad<F> & Ask<F>) {
  return <K, A>(shared: Shared<F, K, A>): HKT<F, A> =>
    pipe(
      M.ask<GetShared<F>>(),
      M.chain((e) => e.getShared(shared)),
    )
}
