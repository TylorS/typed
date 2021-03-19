import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export interface SetShared<F> {
  readonly setShared: <A>(value: A) => <K, E>(shared: Shared<F, K, E, A>) => HKT2<F, E, A>
}

export interface SetShared2<F extends URIS2> {
  readonly setShared: <A>(value: A) => <K, E>(shared: Shared2<F, K, E, A>) => Kind2<F, E, A>
}

export interface SetShared2C<F extends URIS2, E> {
  readonly setShared: <A>(value: A) => <K>(shared: Shared2<F, K, E, A>) => Kind2<F, E, A>
}

export interface SetShared3<F extends URIS3> {
  readonly setShared: <A>(
    value: A,
  ) => <K, R, E>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface SetShared3C<F extends URIS3, E> {
  readonly setShared: <A>(value: A) => <K, R>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, E, A>
}

export interface SetShared4<F extends URIS4> {
  readonly setShared: <A>(
    value: A,
  ) => <K, S, R, E>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, R, E, A>
}

export interface SetShared4C<F extends URIS4, E> {
  readonly setShared: <K, S, R, A>(
    shared: Shared4<F, K, S, R, E, A>,
    value: A,
  ) => Kind4<F, S, R, E, A>
}

export function setShared<F extends URIS2>(
  M: MonadReader2<F>,
): <A>(value: A) => <K, E>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | SetShared2<F>>, A>

export function setShared<F extends URIS3>(
  M: MonadReader3<F>,
): <A>(
  value: A,
) => <K, R, E>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | SetShared3<F>>, E, A>

export function setShared<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <A>(
  value: A,
) => <K, R>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | SetShared3C<F, E>>, E, A>

export function setShared<F extends URIS4>(
  M: MonadReader4<F>,
): <A>(
  value: A,
) => <K, S, R, E>(shared: Shared4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | SetShared4<F>>, E, A>

export function setShared<F>(
  M: MonadReader<F>,
): <A>(value: A) => <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, WidenI<E | SetShared<F>>, A>

export function setShared<F>(M: MonadReader<F>) {
  return <A>(value: A) => <K, E>(
    shared: Shared<F, K, E, A>,
  ): HKT2<F, WidenI<E | SetShared<F>>, A> =>
    pipe(
      ask(M)<SetShared<F>>(),
      M.chain((x) => x.setShared(value)(shared)),
    ) as HKT2<F, WidenI<E | SetShared<F>>, A>
}
