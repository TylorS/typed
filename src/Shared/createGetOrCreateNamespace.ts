import {
  ask,
  MonadReader,
  MonadReader2,
  MonadReader3,
  MonadReader3C,
  MonadReader4,
} from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import { FromIO, FromIO2, FromIO3, FromIO3C, FromIO4 } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { HKT2, Kind2, Kind3, Kind4, URIS2, URIS3, URIS4 } from 'fp-ts/dist/HKT'

import { createGetOrInsert } from './createGetOrInsert'
import { createSendSharedEvent } from './createSendSharedEvent'
import { Shared } from './Shared'

export function createGetOrCreateNamespace<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): <K extends PropertyKey>(namespace: Namespace<K>) => Kind2<F, Shared<F>, Map<any, any>>

export function createGetOrCreateNamespace<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <K extends PropertyKey, E = never>(
  namespace: Namespace<K>,
) => Kind3<F, Shared<F>, E, Map<any, any>>

export function createGetOrCreateNamespace<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): <K extends PropertyKey>(namespace: Namespace<K>) => Kind3<F, Shared<F>, E, Map<any, any>>

export function createGetOrCreateNamespace<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <K extends PropertyKey, S, E = never>(
  namespace: Namespace<K>,
) => Kind4<F, S, Shared<F>, E, Map<any, any>>

export function createGetOrCreateNamespace<F>(
  M: MonadReader<F> & FromIO<F>,
): <K extends PropertyKey>(namespace: Namespace<K>) => HKT2<F, Shared<F>, Map<any, any>>

export function createGetOrCreateNamespace<F>(M: MonadReader<F> & FromIO<F>) {
  const getOrInsert = createGetOrInsert(M)
  const sendEvent = createSendSharedEvent(M)
  const insert = M.fromIO(() => new Map())

  return <K extends PropertyKey>(namespace: Namespace<K>) =>
    pipe(
      ask(M)<Shared<F>>(),
      M.chain(({ sharedKeyStore }) =>
        getOrInsert(
          sharedKeyStore,
          namespace,
          pipe(
            insert,
            M.chain((x) =>
              pipe(
                sendEvent({ type: 'namespace/created', namespace }),
                M.map(() => x),
              ),
            ),
          ) as HKT2<F, Shared<F>, Map<any, any>>,
        ),
      ),
    )
}
