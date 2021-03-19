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

export interface GetShared<F> {
  readonly getShared: <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, E, A>
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
  M: MonadReader2<F>,
): <K, E, A>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | GetShared2<F>>, A>

export function getShared<F extends URIS3>(
  M: MonadReader3<F>,
): <K, R, E, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, R, WidenI<E | GetShared3<F>>, A>

export function getShared<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <K, R, A>(shared: Shared3<F, K, R, E, A>) => Kind3<F, WidenI<R | GetShared3<F>>, E, A>

export function getShared<F extends URIS4>(
  M: MonadReader4<F>,
): <K, S, R, E, A>(
  shared: Shared4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<R | GetShared4<F>>, E, A>

export function getShared<F>(
  M: MonadReader<F>,
): <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, WidenI<E | GetShared<F>>, A>

export function getShared<F>(M: MonadReader<F>) {
  return <K, E, A>(shared: Shared<F, K, E, A>): HKT2<F, WidenI<E | GetShared<F>>, A> =>
    pipe(
      ask(M)<GetShared<F>>(),
      M.chain((e) => e.getShared(shared)),
    ) as HKT2<F, WidenI<E | GetShared<F>>, A>
}
