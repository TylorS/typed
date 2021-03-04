import { Ask } from '@typed/fp/Ask'
import {
  MonadAsk2,
  MonadAsk2C,
  MonadAsk3,
  MonadAsk3C,
  MonadAsk4,
  MonadAsk4C,
} from '@typed/fp/MonadAsk'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Monad } from 'fp-ts/dist/Monad'

import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export interface GetShared<F> {
  readonly getShared: <K, A>(shared: Shared<F, K, A>) => HKT<F, A>
}

export interface GetShared2<F extends URIS2> {
  readonly getShared: <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, E, A>
}

export interface GetShared2C<F extends URIS2, E> {
  readonly getShared: <K, A>(shared: Shared2<F, K, E, A>) => Kind2<F, E, A>
}

export interface GetShared3<F extends URIS3> {
  readonly getShared: <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface GetShared3C<F extends URIS3, E> {
  readonly getShared: <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface GetShared4<F extends URIS4> {
  readonly getShared: <K, S, R, E, A>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, R, E, A>
}

export interface GetShared4C<F extends URIS4, E> {
  readonly getShared: <K, S, R, A>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, R, E, A>
}

export function getShared<F extends URIS2>(
  M: MonadAsk2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | GetShared2<F>>, A>

export function getShared<F extends URIS2, E>(
  M: MonadAsk2C<F, E>,
): <K, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | GetShared2<F>>, A>

export function getShared<F extends URIS3>(
  M: MonadAsk3<F>,
): <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, WidenI<E | GetShared3<F>>, A>

export function getShared<F extends URIS3, E>(
  M: MonadAsk3C<F, E>,
): <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | GetShared3<F>>, E, A>

export function getShared<F extends URIS4>(
  M: MonadAsk4<F>,
): <K, S, R, E, A>(
  shared: Shared4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<R | GetShared4<F>>, E, A>

export function getShared<F extends URIS4, E>(
  M: MonadAsk4C<F, E>,
): <K, S, R, A>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | GetShared4<F>>, E, A>

export function getShared<F>(M: Monad<F> & Ask<F>): <K, A>(shared: Shared<F, K, A>) => HKT<F, A>

export function getShared<F>(M: Monad<F> & Ask<F>) {
  return <K, A>(shared: Shared<F, K, A>): HKT<F, A> =>
    pipe(
      M.ask<GetShared<F>>(),
      M.chain((e) => e.getShared(shared)),
    )
}
