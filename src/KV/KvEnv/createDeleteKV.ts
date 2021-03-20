import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { chainFirst } from 'fp-ts/dist/Chain'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { DeleteKV, DeleteKV2, DeleteKV3, DeleteKV3C, DeleteKV4 } from '../deleteKV'
import { KV } from '../KV'
import { createSendSharedEvent } from './createSendSharedEvent'
import { KvEnv, KvOf } from './KvEnv'
import { lookup } from './lookup'

export function createDeleteKV<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): DeleteKV4<F>['deleteKV']
export function createDeleteKV<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): DeleteKV3<F>['deleteKV']
export function createDeleteKV<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): DeleteKV3C<F, E>['deleteKV']
export function createDeleteKV<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): DeleteKV2<F>['deleteKV']
export function createDeleteKV<F>(M: MonadReader<F> & FromIO<F>): DeleteKV<F>['deleteKV']

export function createDeleteKV<F>(M: MonadReader<F> & FromIO<F>) {
  const sendEvent = createSendSharedEvent(M)
  const chainF = chainFirst(M)
  const get = ask(M)

  return <K, E, A>(kv: KV<F, K, E, A>) =>
    pipe(
      get<KvEnv<F, K, A>>(),
      M.chain(({ kvMap: sharedMap }) =>
        pipe(
          sharedMap,
          lookup(kv.key),
          M.of,
          chainF(() => sendEvent({ type: 'kv/deleted', kv: kv as KvOf<F> })),
        ),
      ),
    )
}
