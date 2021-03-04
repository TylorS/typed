import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'
import { none, Option, some } from 'fp-ts/dist/Option'

import { Shared, Shared2, Shared3, Shared4 } from '../Shared'
import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { createSendSharedEvent } from './createSendSharedEvent'
import { RuntimeEnv } from './RuntimeEnv'
import { SharedOf } from './SharedEvent'

export function createDeleteShared<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (env: RuntimeEnv<F>) => <K, A, B>(shared: Shared2<F, K, A, B>) => Kind2<F, A, B>

export function createDeleteShared<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): (env: RuntimeEnv<F>) => <K, A, B, C>(shared: Shared3<F, K, A, B, C>) => Kind3<F, A, B, C>

export function createDeleteShared<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): (
  env: RuntimeEnv<F>,
) => <K, A, B, C, D>(shared: Shared4<F, K, A, B, C, D>) => Kind4<F, A, B, C, D>

export function createDeleteShared<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (env: RuntimeEnv<F>) => <K, A>(shared: Shared<F, K, A>) => HKT<F, Option<any>>

export function createDeleteShared<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const sendSharedEvent = createSendSharedEvent(M)
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return (env: RuntimeEnv<F>) => (shared: SharedOf<F>) =>
    pipe(
      getCurrentNamespace(),
      M.chain((namespace) =>
        pipe(
          namespace,
          getOrCreateNamespace,
          M.chain((sharedMap) => {
            const value = sharedMap.has(shared.key) ? some(sharedMap.get(shared.key)) : none

            sharedMap.delete(shared.key)

            return pipe(
              sendSharedEvent({ type: 'sharedValue/deleted', namespace, shared }),
              M.map(() => value),
            )
          }),
        ),
      ),
      M.useSome(env),
    )
}
