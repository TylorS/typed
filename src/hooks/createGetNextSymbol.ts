import { bind } from 'fp-ts/dist/Chain'
import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO2, FromIO3, FromIO3C, FromIO4, FromIO } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { URIS2, Kind2, URIS3, Kind3, URIS4, Kind4, HKT } from 'fp-ts/dist/HKT'
import { Eq } from 'fp-ts/dist/number'
import { getEq } from 'fp-ts/dist/ReadonlyMap'
import {
  MonadAsk2,
  MonadAsk3,
  MonadAsk3C,
  MonadAsk4,
  MonadAsk4C,
  MonadAsk,
} from '@typed/fp/MonadAsk'
import { RuntimeEnv, createShared, createGetShared, createGetOrInsert } from '@typed/fp/Shared'
import { createGetNextIndex } from './createGetNextIndex'

export const NEXT_SYMBOL = Symbol('NextSymbol')

export function createGetNextSymbol<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F>,
): () => Kind2<F, RuntimeEnv<F>, symbol>

export function createGetNextSymbol<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F>,
): <E>() => Kind3<F, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS3, E>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E>,
): () => Kind3<F, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F>,
): <S, E>() => Kind4<F, S, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS4, E>(
  M: MonadAsk4C<F, E> & FromIO4<F>,
): <S>() => Kind4<F, S, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F>(M: MonadAsk<F> & FromIO<F>): () => HKT<F, symbol>

export function createGetNextSymbol<F>(M: MonadAsk<F> & FromIO<F>) {
  const shared = createShared<F>()(
    NEXT_SYMBOL,
    M.fromIO(() => new Map<number, symbol>()),
    getEq(Eq, EqStrict),
  )
  const getShared = createGetShared(M)
  const getOrInsert = createGetOrInsert(M)
  const bindTo = bind(M)
  const getNextIndex = createGetNextIndex(M)

  return () =>
    pipe(
      M.of({}),
      bindTo('map', () => getShared(shared)),
      bindTo('index', getNextIndex),
      M.chain(({ map, index }) =>
        getOrInsert(
          map,
          index,
          M.fromIO(() => Symbol(index)),
        ),
      ),
    )
}
