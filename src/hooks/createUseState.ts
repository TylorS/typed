import {
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { createShared as createShared_, RuntimeEnv } from '@typed/fp/Shared'
import { WidenI } from '@typed/fp/Widen'
import { Eq } from 'fp-ts/dist/Eq'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetNextSymbol } from './createGetNextSymbol'
import { createGetSharedState } from './createGetSharedState'
import { UseState, UseState2, UseState3, UseState4 } from './UseState'

export function createUseState<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <E, A>(
  initial: Kind2<F, E, A>,
  eq?: Eq<A>,
) => Kind2<F, WidenI<E | RuntimeEnv<F>>, UseState2<F, A, A>>

export function createUseState<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <R, E, A>(
  initial: Kind3<F, R, E, A>,
  eq?: Eq<A>,
) => Kind3<F, WidenI<R | RuntimeEnv<F>>, E, UseState3<F, A, A, E>>

export function createUseState<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): <R, A>(
  initial: Kind3<F, R, E, A>,
  eq?: Eq<A>,
) => Kind3<F, WidenI<R | RuntimeEnv<F>>, E, UseState3<F, A, A, E>>

export function createUseState<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <S, R, E, A>(
  initial: Kind4<F, S, R, E, A>,
  eq?: Eq<A>,
) => Kind4<F, S, WidenI<R | RuntimeEnv<F>>, E, UseState4<F, A, A, S, E>>

export function createUseState<F>(
  M: MonadReader<F> & FromIO<F>,
): <E, A>(initial: HKT2<F, E, A>, eq?: Eq<A>) => HKT2<F, E, UseState<F, A>>

export function createUseState<F>(M: MonadReader<F> & FromIO<F>) {
  const getNextSymbol = createGetNextSymbol(M)
  const createShared = createShared_<F>()
  const getSharedState = createGetSharedState(M)

  return <E, A>(initial: HKT2<F, E, A>, eq?: Eq<A>) =>
    pipe(
      getNextSymbol(),
      M.chain((symbol) => getSharedState(createShared(symbol, initial, eq))),
    )
}
