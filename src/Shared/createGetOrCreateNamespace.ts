import { ask, MonadReader } from '@typed/fp/MonadReader'
import { Namespace } from '@typed/fp/Namespace'
import { FromIO } from 'fp-ts/dist/FromIO'
import { pipe } from 'fp-ts/dist/function'
import { match } from 'fp-ts/dist/Option'

import { lookup } from '../KvEnv/lookup'
import { createSendSharedEvent } from './createSendSharedEvent'
import { SharedEnv } from './SharedEnv'

export function createGetOrCreateNamespace<F>(M: MonadReader<F> & FromIO<F>) {
  const get = ask(M)
  const sendSharedEvent = createSendSharedEvent(M)

  return (namespace: Namespace) =>
    pipe(
      get<SharedEnv<F>>(),
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
