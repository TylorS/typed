import { ask } from '@typed/fp/MonadReader'
import { Chain, Chain2, Chain3, Chain3C, Chain4 } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import {
  FromReader,
  FromReader2,
  FromReader3,
  FromReader3C,
  FromReader4,
} from 'fp-ts/dist/FromReader'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { SharedEnv, SharedEvent } from './SharedEnv'

export function createSendSharedEvent<F extends URIS4>(
  M: FromReader4<F> & FromIO4<F> & Chain4<F>,
): <S, E = never>(event: SharedEvent<F>) => Kind4<F, S, SharedEnv<F>, E, void>

export function createSendSharedEvent<F extends URIS3>(
  M: FromReader3<F> & FromIO3<F> & Chain3<F>,
): <E = never>(event: SharedEvent<F>) => Kind3<F, SharedEnv<F>, E, void>

export function createSendSharedEvent<F extends URIS3, E>(
  M: FromReader3C<F, E> & FromIO3C<F, E> & Chain3C<F, E>,
): (event: SharedEvent<F>) => Kind3<F, SharedEnv<F>, E, void>

export function createSendSharedEvent<F extends URIS2>(
  M: FromReader2<F> & FromIO2<F> & Chain2<F>,
): (event: SharedEvent<F>) => Kind2<F, SharedEnv<F>, void>

export function createSendSharedEvent<F>(
  M: FromReader<F> & FromIO<F> & Chain<F>,
): (event: SharedEvent<F>) => HKT2<F, SharedEnv<F>, void>

export function createSendSharedEvent<F>(M: FromReader<F> & FromIO<F> & Chain<F>) {
  const get = ask(M)

  return (event: SharedEvent<F>) =>
    pipe(
      get<SharedEnv<F>>(),
      M.chain(({ sharedEvents }) => M.fromIO(() => sharedEvents[0](event))),
    ) as HKT2<F, SharedEnv<F>, void>
}
