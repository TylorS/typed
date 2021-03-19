import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { WidenI } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { GetShared, getShared, GetShared2, GetShared3, GetShared3C } from './getShared'
import { SetShared, setShared, SetShared2, SetShared3, SetShared3C } from './setShared'
import { Shared, Shared2, Shared3, Shared4 } from './Shared'

export function modifyShared<F extends URIS2>(
  M: MonadReader2<F>,
): <A>(
  f: (value: A) => A,
) => <K, E>(shared: Shared2<F, K, E, A>) => Kind2<F, WidenI<E | SetShared2<F> | GetShared2<F>>, A>

export function modifyShared<F extends URIS3>(
  M: MonadReader3<F>,
): <A>(
  f: (value: A) => A,
) => <K, R, E>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, WidenI<R | SetShared3<F> | GetShared3<F>>, E, A>

export function modifyShared<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): <A>(
  f: (value: A) => A,
) => <K, R>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, WidenI<R | SetShared3C<F, E> | GetShared3C<F, E>>, E, A>

export function modifyShared<F extends URIS4>(
  M: MonadReader4<F>,
): <A>(
  f: (value: A) => A,
) => <K, S, R, E>(
  shared: Shared4<F, K, S, R, E, A>,
) => Kind4<F, S, WidenI<R | SetShared<F> | GetShared<F>>, E, A>

export function modifyShared<F>(
  M: MonadReader<F>,
): <A>(
  f: (value: A) => A,
) => <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, WidenI<E | SetShared<F> | GetShared<F>>, A>

export function modifyShared<F>(M: MonadReader<F>) {
  const get = getShared(M)
  const set = setShared(M)

  return <A>(f: (value: A) => A) => <K, E>(shared: Shared<F, K, E, A>) =>
    pipe(
      shared,
      get,
      M.chain((a) => pipe(shared, set(f(a)) as any)),
    ) as HKT2<F, WidenI<E | SetShared<F> | GetShared<F>>, A>
}
