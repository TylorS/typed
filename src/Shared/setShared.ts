import {
  MonadAsk,
  MonadAsk2,
  MonadAsk2C,
  MonadAsk3,
  MonadAsk3C,
  MonadAsk4,
  MonadAsk4C,
} from '@typed/fp/MonadAsk'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind, Kind2, Kind3, Kind4, URIS, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared, Shared1, Shared2, Shared3, Shared4 } from './Shared'

export interface SetShared<F> {
  readonly setShared: <K, A>(shared: Shared<F, K, A>, value: A) => HKT<F, A>
}

export interface SetShared1<F extends URIS> {
  readonly setShared: <K, A>(shared: Shared1<F, K, A>, value: A) => Kind<F, A>
}

export interface SetShared2<F extends URIS2> {
  readonly setShared: <K, E, A>(shared: Shared2<F, K, E, A>, value: A) => Kind2<F, E, A>
}

export interface SetShared2C<F extends URIS2, E> {
  readonly setShared: <K, A>(shared: Shared2<F, K, E, A>, value: A) => Kind2<F, E, A>
}

export interface SetShared3<F extends URIS3> {
  readonly setShared: <K, R, E, A>(shared: Shared3<F, K, R, E, A>, value: A) => Kind3<F, R, E, A>
}

export interface SetShared3C<F extends URIS3, E> {
  readonly setShared: <K, R, A>(shared: Shared3<F, K, R, E, A>, value: A) => Kind3<F, R, E, A>
}

export interface SetShared4<F extends URIS4> {
  readonly setShared: <K, S, R, E, A>(
    shared: Shared4<F, K, S, R, E, A>,
    value: A,
  ) => Kind4<F, S, R, E, A>
}

export interface SetShared4C<F extends URIS4, E> {
  readonly setShared: <K, S, R, A>(
    shared: Shared4<F, K, S, R, E, A>,
    value: A,
  ) => Kind4<F, S, R, E, A>
}

export function setShared<F extends URIS2>(
  M: MonadAsk2<F>,
): <A>(value: A) => <K, E>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | SetShared<F>>, A>

export function setShared<F extends URIS2, E>(
  M: MonadAsk2C<F, E>,
): <A>(value: A) => <K>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | SetShared<F>>, A>

export function setShared<F extends URIS3>(
  M: MonadAsk3<F>,
): <A>(
  value: A,
) => <K, R, E>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | SetShared<F>>, E, A>

export function setShared<F extends URIS3, E>(
  M: MonadAsk3C<F, E>,
): <A>(
  value: A,
) => <K, R>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | SetShared<F>>, E, A>

export function setShared<F extends URIS4>(
  M: MonadAsk4<F>,
): <A>(
  value: A,
) => <K, S, R, E>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | SetShared<F>>, E, A>

export function setShared<F extends URIS4, E>(
  M: MonadAsk4C<F, E>,
): <A>(
  value: A,
) => <K, S, R>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | SetShared<F>>, E, A>

export function setShared<F>(
  M: MonadAsk<F>,
): <A>(value: A) => <K, A>(shared: Shared<F, K, A>) => HKT<F, A>

export function setShared<F>(M: MonadAsk<F>) {
  return <A>(value: A) => <K>(shared: Shared<F, K, A>): HKT<F, A> =>
    pipe(
      M.ask<SetShared<F>>(),
      M.chain((x) => x.setShared(shared, value)),
    )
}
