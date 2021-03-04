import { MonadAsk, MonadAsk2, MonadAsk2C, MonadAsk3, MonadAsk3C } from '@typed/fp/MonadAsk'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Option } from 'fp-ts/dist/Option'

import { Shared, Shared2, Shared3, Shared4 } from './Shared'

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

export interface DeleteShared4<F extends URIS4> {
  readonly deleteShared: <K, S, R, E, A>(
    shared: Shared4<F, K, S, R, E, A>,
  ) => Kind4<F, S, R, E, Option<A>>
}

export function deleteShared<F extends URIS2>(
  M: MonadAsk2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | DeleteShared2<F>>, Option<A>>

export function deleteShared<F extends URIS2, E>(
  M: MonadAsk2C<F, E>,
): <K, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | DeleteShared2<F>>, Option<A>>

export function deleteShared<F extends URIS3>(
  M: MonadAsk3<F>,
): <K, R, E, A>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, R, WidenI<E | DeleteShared3<F>>, Option<A>>

export function deleteShared<F extends URIS3, E>(
  M: MonadAsk3C<F, E>,
): <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | DeleteShared3<F>>, E, Option<A>>

export function deleteShared<F>(
  M: MonadAsk<F>,
): <K, A>(shared: Shared<F, K, A>) => HKT<F, Option<A>>

export function deleteShared<F>(M: MonadAsk<F>) {
  return <K, A>(shared: Shared<F, K, A>): HKT<F, Option<A>> =>
    pipe(
      M.ask<DeleteShared<F>>(),
      M.chain((e) => e.deleteShared(shared)),
    )
}
