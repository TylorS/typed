import { bind } from 'fp-ts/dist/Chain'
import { Eq } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { createGetNextSymbol } from './createGetNextSymbol'
import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk3C, MonadAsk4 } from '@typed/fp/MonadAsk'
import { UseSome, UseSome2, UseSome3, UseSome3C, UseSome4 } from '@typed/fp/Provide'
import { createShared as createShared_, RuntimeEnv } from '@typed/fp/Shared'
import { createGetSharedState } from './createGetSharedState'
import { UseState } from './UseState'
import { WidenI } from '@typed/fp/Widen'

export function createUseState<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): <E, A>(
  initial: Kind2<F, E, A>,
  eq?: Eq<A>,
) => Kind2<F, WidenI<E | RuntimeEnv<F>>, UseState<F, A>>

export function createUseState<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): <R, E, A>(
  initial: Kind3<F, R, E, A>,
  eq?: Eq<A>,
) => Kind3<F, WidenI<R | RuntimeEnv<F>>, E, UseState<F, A>>

export function createUseState<F extends URIS3, E>(
  M: MonadAsk3C<F, E> & FromIO3C<F, E> & UseSome3C<F, E>,
): <R, A>(
  initial: Kind3<F, R, E, A>,
  eq?: Eq<A>,
) => Kind3<F, WidenI<R | RuntimeEnv<F>>, E, UseState<F, A>>

export function createUseState<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): <S, R, E, A>(
  initial: Kind4<F, S, R, E, A>,
  eq?: Eq<A>,
) => Kind4<F, S, WidenI<R | RuntimeEnv<F>>, E, UseState<F, A>>

export function createUseState<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): <A>(initial: HKT<F, A>, eq?: Eq<A>) => HKT<F, UseState<F, A>>

export function createUseState<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const getNextSymbol = createGetNextSymbol(M)
  const bindTo = bind(M)
  const createShared = createShared_<F>()
  const Do = M.of({})
  const getSharedState = createGetSharedState(M)

  return <A>(initial: HKT<F, A>, eq?: Eq<A>) =>
    pipe(
      Do,
      bindTo('env', () => M.ask<RuntimeEnv<F>>()),
      bindTo('symbol', ({ env }) => getNextSymbol(env)),
      M.chain(({ symbol }) => getSharedState(createShared(symbol, initial, eq))),
    )
}
