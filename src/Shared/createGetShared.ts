import { KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { WidenI } from '@typed/fp/Widen'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { createGetOrInsert } from './createGetOrInsert'
import { createSendSharedEvent } from './createSendSharedEvent'
import { Shared } from './Shared'
import { KVOf } from './SharedEvent'

export function createGetKV<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K, A, B>(kv: KV2<F, K, A, B>) => Kind2<F, WidenI<Shared<F> | A>, B>

export function createGetKV<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K, A, B, C>(kv: KV3<F, K, A, B, C>) => Kind3<F, WidenI<Shared<F> | A>, B, C>

export function createGetKV<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K, A, B, C, D>(kv: KV4<F, K, A, B, C, D>) => Kind4<F, A, WidenI<Shared<F> | B>, C, D>

export function createGetKV<F>(
  M: MonadReader<F> & FromIO<F>,
): <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, WidenI<Shared<F> | E>, A>

export function createGetKV<F>(M: MonadReader<F> & FromIO<F>) {
  const getOrInsert = createGetOrInsert(M)
  const sendSharedEvent = createSendSharedEvent(M)
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return (kv: KVOf<F>) =>
    pipe(
      getCurrentNamespace(),
      M.chain((namespace) =>
        pipe(
          namespace,
          getOrCreateNamespace,
          M.chain((sharedMap) =>
            getOrInsert(
              sharedMap,
              kv.key,
              pipe(
                kv.initial as HKT2<F, any, any>,
                M.chain((value) =>
                  pipe(
                    sendSharedEvent({ type: 'kv/created', namespace, kv, value }),
                    M.map(() => value),
                  ),
                ),
              ) as HKT2<F, Shared<F>, Map<any, any>>,
            ),
          ),
        ),
      ),
    )
}
