import { Ask, Ask2, Ask3, Ask3C } from '@typed/fp/Ask'
import { IntersectionWiden, Widen, WideningOptions } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { Monad, Monad2, Monad3 } from 'fp-ts/dist/Monad'
import { Option } from 'fp-ts/dist/Option'

import { Shared, Shared2, Shared3 } from './Shared'

export interface DeleteShared<F> {
  readonly deleteShared: <K, A>(shared: Shared<F, K, A>) => HKT<F, Option<A>>
}

export interface DeleteShared2<F extends URIS2> {
  readonly deleteShared: <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, E, Option<A>>
}

export interface DeleteShared3<F extends URIS3> {
  readonly deleteShared: <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, Option<A>>
}

export interface DeleteShared3C<F extends URIS3, E> {
  readonly deleteShared: <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, Option<A>>
}

export function deleteShared<F extends URIS2, W extends WideningOptions = IntersectionWiden>(
  M: Monad2<F> & Ask2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, Widen<E | DeleteShared2<F>, W[2]>, Option<A>>

export function deleteShared<F extends URIS3, W extends WideningOptions = IntersectionWiden>(
  M: Monad3<F> & Ask3<F>,
): <K, R, E, A>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, R, Widen<E | DeleteShared3<F>, W[2]>, Option<A>>

export function deleteShared<F extends URIS3, E, W extends WideningOptions = IntersectionWiden>(
  M: Monad3<F> & Ask3C<F, E>,
): <K, R, A>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, Widen<R | DeleteShared3<F>, W[3]>, E, Option<A>>

export function deleteShared<F>(
  M: Monad<F> & Ask<F>,
): <K, A>(shared: Shared<F, K, A>) => HKT<F, Option<A>>

export function deleteShared<F>(M: Monad<F> & Ask<F>) {
  return <K, A>(shared: Shared<F, K, A>): HKT<F, Option<A>> =>
    pipe(
      M.ask<DeleteShared<F>>(),
      M.chain((e) => e.deleteShared(shared)),
    )
}
