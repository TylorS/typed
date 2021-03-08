import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { Eq } from 'fp-ts/dist/number'
import {
  MonadAsk,
  MonadAsk2,
  MonadAsk3,
  MonadAsk3C,
  MonadAsk4,
  MonadAsk4C,
} from '@typed/fp/MonadAsk'
import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4, UseSome4C } from '@typed/fp/Provide'
import { createGetShared, createSetShared, createShared, RuntimeEnv } from '@typed/fp/Shared'
import { constVoid, pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

export const NEXT_INDEX = Symbol('NextIndex')
export const INITIAL_INDEX = 0

export function createGetNextIndex<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (env: RuntimeEnv<F>) => Kind2<F, RuntimeEnv<F>, number>

export function createGetNextIndex<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): <E>(env: RuntimeEnv<F>) => Kind3<F, RuntimeEnv<F>, E, number>

export function createGetNextIndex<F extends URIS3, E>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): (env: RuntimeEnv<F>) => Kind3<F, RuntimeEnv<F>, E, number>

export function createGetNextIndex<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): <S, E>(env: RuntimeEnv<F>) => Kind4<F, S, RuntimeEnv<F>, E, number>

export function createGetNextIndex<F extends URIS4, E>(
  M: MonadAsk4C<F, E> & FromIO4<F> & UseSome4C<F, E>,
): <S>(env: RuntimeEnv<F>) => Kind4<F, S, RuntimeEnv<F>, E, number>

export function createGetNextIndex<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (env: RuntimeEnv<F>) => HKT<F, number>

export function createGetNextIndex<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const shared = createShared<F>()(NEXT_INDEX, M.of(INITIAL_INDEX), Eq)
  const getShared = createGetShared(M)
  const setShared = createSetShared(M)

  return (env: RuntimeEnv<F>) =>
    pipe(
      shared,
      getShared(env),
      M.chain((index) =>
        pipe(
          setShared(env)(shared, index + 1),
          M.map(() => index),
        ),
      ),
    )
}

export function createResetIndex<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (env: RuntimeEnv<F>) => Kind2<F, RuntimeEnv<F>, void>

export function createResetIndex<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): <E>(env: RuntimeEnv<F>) => Kind3<F, RuntimeEnv<F>, E, void>

export function createResetIndex<F extends URIS3, E>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): (env: RuntimeEnv<F>) => Kind3<F, RuntimeEnv<F>, E, void>

export function createResetIndex<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): <S, E>(env: RuntimeEnv<F>) => Kind4<F, S, RuntimeEnv<F>, E, void>

export function createResetIndex<F extends URIS4, E>(
  M: MonadAsk4C<F, E> & FromIO4<F> & UseSome4C<F, E>,
): <S>(env: RuntimeEnv<F>) => Kind4<F, S, RuntimeEnv<F>, E, void>

export function createResetIndex<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (env: RuntimeEnv<F>) => HKT<F, void>

export function createResetIndex<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const shared = createShared<F>()(NEXT_INDEX, M.of(INITIAL_INDEX), Eq)
  const setShared = createSetShared(M)

  return (env: RuntimeEnv<F>) => pipe(setShared(env)(shared, INITIAL_INDEX), M.map(constVoid))
}
