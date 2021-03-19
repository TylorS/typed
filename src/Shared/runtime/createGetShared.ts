import { MonadReader, MonadReader2, MonadReader3, MonadReader4 } from '@typed/fp/MonadReader'
import { getCurrentNamespace as getCurrentNamespace_ } from '@typed/fp/Namespace'
import { WidenI } from '@typed/fp/Widen'
import { FromIO, FromIO2, FromIO3, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { Shared, Shared2, Shared3, Shared4 } from '../Shared'
import { createGetOrCreateNamespace } from './createGetOrCreateNamespace'
import { createGetOrInsert } from './createGetOrInsert'
import { createSendSharedEvent } from './createSendSharedEvent'
import { RuntimeEnv } from './RuntimeEnv'
import { SharedOf } from './SharedEvent'

export function createGetShared<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K, A, B>(shared: Shared2<F, K, A, B>) => Kind2<F, WidenI<RuntimeEnv<F> | A>, B>

export function createGetShared<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K, A, B, C>(shared: Shared3<F, K, A, B, C>) => Kind3<F, WidenI<RuntimeEnv<F> | A>, B, C>

export function createGetShared<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K, A, B, C, D>(
  shared: Shared4<F, K, A, B, C, D>,
) => Kind4<F, A, WidenI<RuntimeEnv<F> | B>, C, D>

export function createGetShared<F>(
  M: MonadReader<F> & FromIO<F>,
): <K, E, A>(shared: Shared<F, K, E, A>) => HKT2<F, WidenI<RuntimeEnv<F> | E>, A>

export function createGetShared<F>(M: MonadReader<F> & FromIO<F>) {
  const getOrInsert = createGetOrInsert(M)
  const sendSharedEvent = createSendSharedEvent(M)
  const getCurrentNamespace = getCurrentNamespace_(M)
  const getOrCreateNamespace = createGetOrCreateNamespace(M)

  return (shared: SharedOf<F>) =>
    pipe(
      getCurrentNamespace(),
      M.chain((namespace) =>
        pipe(
          namespace,
          getOrCreateNamespace,
          M.chain((sharedMap) =>
            getOrInsert(
              sharedMap,
              shared.key,
              pipe(
                shared.initial as HKT2<F, any, any>,
                M.chain((value) =>
                  pipe(
                    sendSharedEvent({ type: 'sharedValue/created', namespace, shared, value }),
                    M.map(() => value),
                  ),
                ),
              ) as HKT2<F, RuntimeEnv<F>, Map<any, any>>,
            ),
          ),
        ),
      ),
    )
}
