import { MonadAsk, MonadAsk2, MonadAsk3, MonadAsk4 } from '@typed/fp/MonadAsk'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { UseSome, UseSome2, UseSome3, UseSome4 } from '@typed/fp/Provide'
import { WidenI } from '@typed/fp/Widen'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared, Shared2, Shared3, Shared4 } from '../Shared'
import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { createSendSharedEvent } from './createSendSharedEvent'
import { RuntimeEnv } from './RuntimeEnv'
import { SharedEvent, SharedOf } from './SharedEvent'

export function createSetShared<F extends URIS2>(
  M: MonadAsk2<F> & FromIO2<F> & UseSome2<F>,
): (
  env: RuntimeEnv<F>,
) => <K, A, B>(shared: Shared2<F, K, A, B>, value: B) => Kind2<F, WidenI<RuntimeEnv<F> | A>, B>

export function createSetShared<F extends URIS3>(
  M: MonadAsk3<F> & FromIO3<F> & UseSome3<F>,
): (
  env: RuntimeEnv<F>,
) => <K, A, B, C>(
  shared: Shared3<F, K, A, B, C>,
  value: C,
) => Kind3<F, WidenI<RuntimeEnv<F> | A>, B, C>

export function createSetShared<F extends URIS4>(
  M: MonadAsk4<F> & FromIO4<F> & UseSome4<F>,
): (
  env: RuntimeEnv<F>,
) => <K, A, B, C, D>(
  shared: Shared4<F, K, A, B, C, D>,
  value: D,
) => Kind4<F, A, WidenI<RuntimeEnv<F> | B>, C, D>

export function createSetShared<F>(
  M: MonadAsk<F> & FromIO<F> & UseSome<F>,
): (env: RuntimeEnv<F>) => <K, A>(shared: Shared<F, K, A>, value: A) => HKT<F, A>

export function createSetShared<F>(M: MonadAsk<F> & FromIO<F> & UseSome<F>) {
  const sendSharedEvent = createSendSharedEvent(M)
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return (env: RuntimeEnv<F>) => (shared: SharedOf<F>, value: any) =>
    pipe(
      getCurrentNamespace(),
      M.chain((namespace) =>
        pipe(
          namespace,
          getOrCreateNamespace,
          M.chain((sharedMap) => {
            const hasValue = sharedMap.has(shared.key)
            const previousValue = sharedMap.get(value)

            sharedMap.set(shared.key, value)

            const event: SharedEvent<F> = hasValue
              ? { type: 'sharedValue/updated', namespace, shared, previousValue, value }
              : { type: 'sharedValue/created', namespace, shared, value }

            return pipe(
              event,
              sendSharedEvent,
              M.map(() => value),
            )
          }),
        ),
      ),
      M.useSome(env),
    )
}
