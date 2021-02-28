import { Ask, Ask2, Ask3 } from '@typed/fp/Ask'
import { IntersectionWiden, Widen, WideningOptions } from '@typed/fp/Widen'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/dist/HKT'
import { Monad, Monad2, Monad3 } from 'fp-ts/dist/Monad'

import { Shared, Shared1, Shared2, Shared3 } from './Shared'

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

export function setShared<F extends URIS2, W extends WideningOptions = IntersectionWiden>(
  M: Ask2<F> & Monad2<F>,
): <A>(
  value: A,
) => <K, E>(shared: Shared2<F, K, E, A>) => Kind2<F, Widen<E | SetShared<F>, W[2]>, A>

export function setShared<F extends URIS2, E, W extends WideningOptions = IntersectionWiden>(
  M: Ask2<F> & Monad2<F>,
): <A>(value: A) => <K>(shared: Shared2<F, K, E, A>) => Kind2<F, Widen<E | SetShared<F>, W[2]>, A>

export function setShared<F extends URIS3, W extends WideningOptions = IntersectionWiden>(
  M: Ask3<F> & Monad3<F>,
): <A>(
  value: A,
) => <K, R, E>(shared: Shared3<F, K, R, E, A>) => Kind3<F, Widen<R | SetShared<F>, W[3]>, E, A>

export function setShared<F extends URIS3, E, W extends WideningOptions = IntersectionWiden>(
  M: Ask3<F> & Monad3<F>,
): <A>(
  value: A,
) => <K, R>(shared: Shared3<F, K, R, E, A>) => Kind3<F, Widen<R | SetShared<F>, W[3]>, E, A>

export function setShared<F>(
  M: Ask<F> & Monad<F>,
): <A>(value: A) => <K, A>(shared: Shared<F, K, A>) => HKT<F, A>

export function setShared<F>(M: Ask<F> & Monad<F>) {
  return <A>(value: A) => <K>(shared: Shared<F, K, A>): HKT<F, A> =>
    pipe(
      M.ask<SetShared<F>>(),
      M.chain((x) => x.setShared(shared, value)),
    )
}
