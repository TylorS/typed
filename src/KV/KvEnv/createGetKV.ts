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
import { match } from 'fp-ts/dist/Option'

import { GetKV, GetKV2, GetKV3, GetKV3C, GetKV4 } from '../getKV'
import { KV } from '../KV'
import { createSendSharedEvent } from './createSendSharedEvent'
import { KvEnv, KvOf } from './KvEnv'
import { lookup } from './lookup'

export function createGetKV<F extends URIS4>(M: MonadReader4<F> & FromIO4<F>): GetKV4<F>['getKV']
export function createGetKV<F extends URIS3>(M: MonadReader3<F> & FromIO3<F>): GetKV3<F>['getKV']
export function createGetKV<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): GetKV3C<F, E>['getKV']
export function createGetKV<F extends URIS2>(M: MonadReader2<F> & FromIO2<F>): GetKV2<F>['getKV']
export function createGetKV<F>(M: MonadReader<F> & FromIO<F>): GetKV<F>['getKV']

export function createGetKV<F>(M: MonadReader<F> & FromIO<F>) {
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
          match(
            // If there is no value already in the sharedMap, run the KV's initial value effect
            // and send an event that lets the runtime know that it should record this value.
            () =>
              pipe(
                kv.initial,
                chainF((value) => sendEvent({ type: 'kv/created', kv: kv as KvOf<F>, value })),
              ),
            M.of,
          ),
        ),
      ),
    )
}
