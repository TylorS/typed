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
import { match } from 'fp-ts/dist/Option'

import { createSendSharedEvent } from './createSendSharedEvent'
import { lookup } from './lookup'
import { Shared } from './Shared'

export function createGetOrCreateNamespace<F extends URIS4>(
  M: MonadReader4<F> & FromIO4<F>,
): <R, E>(namespace: Namespace) => Kind4<F, R, Shared<F>, E, ReadonlyMap<any, any>>

export function createGetOrCreateNamespace<F extends URIS3>(
  M: MonadReader3<F> & FromIO3<F>,
): <E>(namespace: Namespace) => Kind3<F, Shared<F>, E, ReadonlyMap<any, any>>

export function createGetOrCreateNamespace<F extends URIS3, E>(
  M: MonadReader3C<F, E> & FromIO3C<F, E>,
): (namespace: Namespace) => Kind3<F, Shared<F>, E, ReadonlyMap<any, any>>

export function createGetOrCreateNamespace<F extends URIS2>(
  M: MonadReader2<F> & FromIO2<F>,
): (namespace: Namespace) => Kind2<F, Shared<F>, ReadonlyMap<any, any>>

export function createGetOrCreateNamespace<F>(
  M: MonadReader<F> & FromIO<F>,
): (namespace: Namespace) => HKT2<F, Shared<F>, ReadonlyMap<any, any>>

export function createGetOrCreateNamespace<F>(M: MonadReader<F> & FromIO<F>) {
  const get = ask(M)
  const sendSharedEvent = createSendSharedEvent(M)

  return (namespace: Namespace) =>
    pipe(
      get<Shared<F>>(),
      M.chain(({ sharedMap }) =>
        pipe(
          sharedMap,
          lookup(namespace),
          match(() => {
            const kvMap = new Map()

            return pipe(
              sendSharedEvent({ type: 'namespace/created', namespace, kvMap }),
              M.map(() => kvMap),
            )
          }, M.of),
        ),
      ),
    )
}
