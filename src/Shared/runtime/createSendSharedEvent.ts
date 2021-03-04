import {
  MonadAsk,
  MonadAsk2,
  MonadAsk3,
  MonadAsk3C,
  MonadAsk4,
  MonadAsk4C,
} from '@typed/fp/MonadAsk'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { RuntimeEnv } from './RuntimeEnv'
import { SharedEvent } from './SharedEvent'

export function createSendSharedEvent<F extends URIS2>(
  M: MonadAsk2<F>,
): (event: SharedEvent<F>) => Kind2<F, RuntimeEnv<F>, void>

export function createSendSharedEvent<F extends URIS3>(
  M: MonadAsk3<F>,
): <E>(event: SharedEvent<F>) => Kind3<F, RuntimeEnv<F>, E, void>

export function createSendSharedEvent<F extends URIS3, E>(
  M: MonadAsk3C<F, E>,
): (event: SharedEvent<F>) => Kind3<F, RuntimeEnv<F>, E, void>

export function createSendSharedEvent<F extends URIS4>(
  M: MonadAsk4<F>,
): <S, E>(event: SharedEvent<F>) => Kind4<F, S, RuntimeEnv<F>, E, void>

export function createSendSharedEvent<F extends URIS4, E>(
  M: MonadAsk4C<F, E>,
): <S>(event: SharedEvent<F>) => Kind4<F, S, RuntimeEnv<F>, E, void>

export function createSendSharedEvent<F>(M: MonadAsk<F>): (event: SharedEvent<F>) => HKT<F, void>

export function createSendSharedEvent<F>(M: MonadAsk<F>) {
  return (event: SharedEvent<F>) =>
    pipe(
      M.ask<RuntimeEnv<F>>(),
      M.chain(({ sharedEvents }) => M.of(sharedEvents[0](event))),
    )
}
