import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared } from './Shared'
import { SharedEvent } from './SharedEvent'

export function createSendSharedEvent<F extends URIS2>(
  M: MonadReader2<F>,
): (event: SharedEvent<F>) => Kind2<F, Shared<F>, void>

export function createSendSharedEvent<F extends URIS3>(
  M: MonadReader3<F>,
): <E>(event: SharedEvent<F>) => Kind3<F, Shared<F>, E, void>

export function createSendSharedEvent<F extends URIS3, E>(
  M: MonadReader3C<F, E>,
): (event: SharedEvent<F>) => Kind3<F, Shared<F>, E, void>

export function createSendSharedEvent<F extends URIS4>(
  M: MonadReader4<F>,
): <S, E>(event: SharedEvent<F>) => Kind4<F, S, Shared<F>, E, void>

export function createSendSharedEvent<F>(
  M: MonadReader<F>,
): (event: SharedEvent<F>) => HKT2<F, Shared<F>, void>

export function createSendSharedEvent<F>(M: MonadReader<F>) {
  return (event: SharedEvent<F>) =>
    pipe(
      ask(M)<Shared<F>>(),
      M.chain(({ sharedEvents }) => M.of(sharedEvents[0](event))),
    )
}
