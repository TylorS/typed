import { KV, KV2, KV3, KV4 } from '@typed/fp/KV'
import { MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { WidenI } from '@typed/fp/Widen'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { none, Option, some } from 'fp-ts/dist/Option'

import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { createSendSharedEvent } from './createSendSharedEvent'
import { Shared } from './Shared'
import { KVOf } from './SharedEvent'

export function createDeleteKV<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K, A, B>(kv: KV2<F, K, A, B>) => Kind2<F, WidenI<Shared<F> | A>, Option<B>>

export function createDeleteKV<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K, A, B, C>(kv: KV3<F, K, A, B, C>) => Kind3<F, WidenI<Shared<F> | A>, B, Option<C>>

export function createDeleteKV<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K, A, B, C, D>(kv: KV4<F, K, A, B, C, D>) => Kind4<F, A, WidenI<Shared<F> | B>, C, Option<D>>

export function createDeleteKV<F>(
  M: MonadReader<F> & FromIO<F>,
): <K, E, A>(kv: KV<F, K, E, A>) => HKT2<F, WidenI<Shared<F> | E>, Option<A>>

export function createDeleteKV<F>(M: MonadReader<F> & FromIO<F>) {
  const sendKVEvent = createSendSharedEvent(M)
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return (kv: KVOf<F>) =>
    pipe(
      getCurrentNamespace(),
      M.chain((namespace) =>
        pipe(
          namespace,
          getOrCreateNamespace,
          M.chain((kvMap) => {
            const value = kvMap.has(kv.key) ? some(kvMap.get(kv.key)) : none

            kvMap.delete(kv.key)

            return pipe(
              sendKVEvent({ type: 'kv/deleted', namespace, kv }),
              M.map(() => value),
            )
          }),
        ),
      ),
    )
}
