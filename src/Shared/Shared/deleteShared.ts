import { MonadReader, MonadReader2, MonadReader3, MonadReader3C } from '@typed/fp/MonadReader'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Option } from 'fp-ts/dist/Option'
import { ask } from 'fp-ts/dist/Reader'

import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export interface DeleteShared<F> {
  readonly deleteShared: <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, E, Option<A>>
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

export interface DeleteShared4<F extends URIS4> {
  readonly deleteShared: <K, S, R, E, A>(
    shared: Shared4<F, K, S, R, E, A>,
  ) => Kind4<F, S, R, E, Option<A>>
}

export function deleteShared<F extends URIS2>(
  M: MonadReader2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | DeleteShared2<F>>, Option<A>>

export function deleteShared<F extends URIS3>(
  M: MonadReader3<F>,
): <K, R, E, A>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, R, WidenI<E | DeleteShared3<F>>, Option<A>>

export function deleteShared<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | DeleteShared3<F>>, E, Option<A>>

export function deleteShared<F>(
  M: MonadReader<F>,
): <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, E, Option<A>>

export function deleteShared<F>(M: MonadReader<F>) {
  return <K, E, A>(shared: Shared<F, K, E, A>): HKT2<F, E, Option<A>> =>
    pipe(
      M.fromReader(ask<DeleteShared<F>>()),
      M.chain((e) => e.deleteShared(shared)),
    ) as HKT2<F, E, Option<A>>
}
