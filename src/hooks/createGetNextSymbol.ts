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
import { UseSome2, UseSome3, UseSome3C, UseSome4, UseSome4C, UseSome } from '@typed/fp/Provide'
import { RuntimeEnv, createShared, createGetShared, createGetOrInsert } from '@typed/fp/Shared'
import { createGetNextIndex } from './createGetNextIndex'

export const NEXT_SYMBOL = Symbol('NextSymbol')

export function createGetNextSymbol<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (env: RuntimeEnv<F>) => Kind2<F, RuntimeEnv<F>, symbol>

export function createGetNextSymbol<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): <E>(env: RuntimeEnv<F>) => Kind3<F, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS3, E>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): (env: RuntimeEnv<F>) => Kind3<F, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): <S, E>(env: RuntimeEnv<F>) => Kind4<F, S, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F extends URIS4, E>(
  M: MonadAsk4C<F, E> & FromIO4<F> & UseSome4C<F, E>,
): <S>(env: RuntimeEnv<F>) => Kind4<F, S, RuntimeEnv<F>, E, symbol>

export function createGetNextSymbol<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (env: RuntimeEnv<F>) => HKT<F, symbol>

export function createGetNextSymbol<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const shared = createShared<F>()(
    NEXT_SYMBOL,
    M.fromIO(() => new Map<number, symbol>()),
    getEq(Eq, EqStrict),
  )
  const getShared = createGetShared(M)
  const getOrInsert = createGetOrInsert(M)
  const bindTo = bind(M)
  const getNextIndex = createGetNextIndex(M)

  return (env: RuntimeEnv<F>) =>
    pipe(
      M.of({}),
      bindTo('map', () => pipe(shared, getShared(env))),
      bindTo('index', () => getNextIndex(env)),
      M.chain(({ map, index }) =>
        getOrInsert(
          map,
          index,
          M.fromIO(() => Symbol(index)),
        ),
      ),
    )
}
