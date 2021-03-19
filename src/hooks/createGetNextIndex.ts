import { createKV } from '@typed/fp/KV'
import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { createGetKV, createSetKV, Shared } from '@typed/fp/Shared'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { constVoid, pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Eq } from 'fp-ts/dist/number'

export const NEXT_INDEX = Symbol('NextIndex')
export const INITIAL_INDEX = 0

export function createGetNextIndex<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): () => Kind2<F, Shared<F>, number>

export function createGetNextIndex<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <E>() => Kind3<F, Shared<F>, E, number>

export function createGetNextIndex<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): () => Kind3<F, Shared<F>, E, number>

export function createGetNextIndex<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <S, E>() => Kind4<F, S, Shared<F>, E, number>

export function createGetNextIndex<F>(
  M: MonadReader<F> & FromIO<F>,
): <E = never>() => HKT2<F, E, number>

export function createGetNextIndex<F>(M: MonadReader<F> & FromIO<F>) {
  const shared = createKV<F>()(NEXT_INDEX, M.of(INITIAL_INDEX) as HKT2<F, any, number>, Eq)
  const getShared = createGetKV(M)
  const setShared = createSetKV(M)

  return () =>
    pipe(
      shared,
      getShared,
      M.chain((index) =>
        pipe(
          shared,
          setShared(index + 1),
          M.map(() => index),
        ),
      ),
    )
}

export function createResetIndex<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): () => Kind2<F, Shared<F>, void>

export function createResetIndex<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <E>() => Kind3<F, Shared<F>, E, void>

export function createResetIndex<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): () => Kind3<F, Shared<F>, E, void>

export function createResetIndex<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <S, E>() => Kind4<F, S, Shared<F>, E, void>

export function createResetIndex<F>(
  M: MonadReader<F> & FromIO<F>,
): <E = never>() => HKT2<F, E, void>

export function createResetIndex<F>(M: MonadReader<F> & FromIO<F>) {
  const shared = createKV<F>()(NEXT_INDEX, M.of(INITIAL_INDEX) as HKT2<F, any, number>, Eq)
  const setShared = createSetKV(M)

  return () => pipe(shared, setShared(INITIAL_INDEX), M.map(constVoid))
}
