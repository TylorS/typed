import { Ask, Ask2, Ask3 } from '@typed/fp/Ask'
import { IntersectionWiden, Widen, WideningOptions } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { Monad, Monad2, Monad3 } from 'fp-ts/dist/Monad'

import { GetShared, getShared } from './getShared'
import { SetShared, setShared } from './setShared'
import { Shared, Shared2, Shared3 } from './Shared'

export function modify<F extends URIS2, W extends WideningOptions = IntersectionWiden>(
  M: Ask2<F> & Monad2<F>,
): <A>(
  f: (value: A) => A,
) => <K, E>(
  shared: Shared2<F, K, E, A>,
) => Kind2<F, Widen<E | SetShared<F> | GetShared<F>, W[2]>, A>

export function modify<F extends URIS2, E, W extends WideningOptions = IntersectionWiden>(
  M: Ask2<F> & Monad2<F>,
): <A>(
  f: (value: A) => A,
) => <K>(shared: Shared2<F, K, E, A>) => Kind2<F, Widen<E | SetShared<F> | GetShared<F>, W[2]>, A>

export function modify<F extends URIS3, W extends WideningOptions = IntersectionWiden>(
  M: Ask3<F> & Monad3<F>,
): <A>(
  f: (value: A) => A,
) => <K, R, E>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, Widen<R | SetShared<F> | GetShared<F>, W[3]>, E, A>

export function modify<F extends URIS3, E, W extends WideningOptions = IntersectionWiden>(
  M: Ask3<F> & Monad3<F>,
): <A>(
  f: (value: A) => A,
) => <K, R>(
  shared: Shared3<F, K, R, E, A>,
) => Kind3<F, Widen<R | SetShared<F> | GetShared<F>, W[3]>, E, A>

export function modify<F>(
  M: Ask<F> & Monad<F>,
): <A>(f: (value: A) => A) => <K, A>(shared: Shared<F, K, A>) => HKT<F, A>

export function modify<F>(M: Ask<F> & Monad<F>) {
  const get = getShared(M)
  const set = setShared(M)

  return <A>(f: (value: A) => A) => <K>(shared: Shared<F, K, A>) =>
    pipe(
      shared,
      get,
      M.chain((a) => pipe(shared, set(f(a)))),
    )
}
