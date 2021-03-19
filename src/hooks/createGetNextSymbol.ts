import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { createGetOrInsert, createGetShared, createShared, RuntimeEnv } from '@typed/fp/Shared'
import { bind } from 'fp-ts/dist/Chain'
import { EqStrict } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { Eq } from 'fp-ts/dist/number'
import { getEq } from 'fp-ts/dist/ReadonlyMap'

import { createGetNextIndex } from './createGetNextIndex'

export const NEXT_SYMBOL = Symbol('NextSymbol')

export function createGetNextSymbol<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): () => Kind2<F, RuntimeEnv<F>, symbol>

export function createGetNextSymbol<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <E>() => Kind3<F, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): () => Kind3<F, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <S, E>() => Kind4<F, S, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F>(
  M: MonadReader<F> & FromIO<F>,
): <E = never>() => HKT2<F, E, symbol>

export function createGetNextSymbol<F>(M: MonadReader<F> & FromIO<F>) {
  const shared = createShared<F>()(
    NEXT_SYMBOL,
    M.fromIO(() => new Map<number, symbol>()) as HKT2<F, any, Map<number, symbol>>,
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
        getOrInsert(map, index, M.fromIO(() => Symbol(index)) as HKT2<F, any, symbol>),
      ),
    )
}
