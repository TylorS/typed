import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { match } from 'fp-ts/dist/Option'

import { KV } from '../KV'
import { SetKV, SetKV2, SetKV3, SetKV3C, SetKV4 } from '../setKV'
import { createSendSharedEvent } from './createSendSharedEvent'
import { KvEnv, KvOf } from './KvEnv'
import { lookup } from './lookup'

export function createSetKV<F extends URIS4>(M: MonadReader4<F> & FromIO4<F>): SetKV4<F>['setKV']
export function createSetKV<F extends URIS3>(M: MonadReader3<F> & FromIO3<F>): SetKV3<F>['setKV']
export function createSetKV<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): SetKV3C<F, E>['setKV']
export function createSetKV<F extends URIS2>(M: MonadReader2<F> & FromIO2<F>): SetKV2<F>['setKV']
export function createSetKV<F>(M: MonadReader<F> & FromIO<F>): SetKV<F>['setKV']

export function createSetKV<F>(M: MonadReader<F> & FromIO<F>) {
  const sendEvent = createSendSharedEvent(M)
  const get = ask(M)

  return <A>(value: A) => <K, E>(kv: KV<F, K, E, A>) =>
    pipe(
      get<KvEnv<F, K, A>>(),
      M.chain(({ kvMap: sharedMap }) =>
        pipe(
          sharedMap,
          lookup(kv.key),
          match(
            () => sendEvent({ type: 'kv/created', kv: kv as KvOf<F>, value }),
            (previousValue) =>
              sendEvent({ type: 'kv/updated', kv: kv as KvOf<F>, previousValue, value }),
          ),
          M.map(() => value),
        ),
      ),
    )
}
