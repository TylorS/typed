import { KV, KV2, KV3, KV4 } from '@typed/fp/KV'
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
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { match } from 'fp-ts/dist/Option'

import { WidenI } from '../Widen'
import { createSendKvEvent } from './createSendKvEvent'
import { KvEnv, KvOf } from './KvEnv'
import { lookup } from './lookup'

export function createSetKV<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <A>(
  value: A,
) => <K, S, R, E>(kv: KV4<F, K, S, R, E, A>) => Kind4<F, S, WidenI<R | KvEnv<F, K, A>>, E, A>

export function createSetKV<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <A>(value: A) => <K, R, E>(kv: KV3<F, K, R, E, A>) => Kind3<F, WidenI<R | KvEnv<F, K, A>>, E, A>

export function createSetKV<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): <A>(value: A) => <K, R>(kv: KV3<F, K, R, E, A>) => Kind3<F, WidenI<R | KvEnv<F, K, A>>, E, A>

export function createSetKV<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <A>(value: A) => <K, E>(kv: KV2<F, K, E, A>) => Kind2<F, WidenI<E | KvEnv<F, K, A>>, A>

export function createSetKV<F>(
  M: MonadReader<F> & FromIO<F>,
): <A>(value: A) => <K, E>(kv: KV<F, K, E, A>) => HKT2<F, WidenI<E | KvEnv<F, K, A>>, A>

export function createSetKV<F>(M: MonadReader<F> & FromIO<F>) {
  const sendEvent = createSendKvEvent(M)
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
