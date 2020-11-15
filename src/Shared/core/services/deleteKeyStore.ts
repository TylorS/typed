import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { sendSharedEvent } from '@typed/fp/Shared/core/events/exports'
import { Namespace, SharedKeyStore } from '@typed/fp/Shared/core/model/exports'
import { SharedEnv } from '@typed/fp/Shared/core/services/SharedEnv'
import { fromNullable, Option } from 'fp-ts/Option'

import { getKeyStores } from './getKeyStores'

/**
 * Delete a Namespace from NamespaceKeyStores, sending out a Deleted
 * event.
 */
export const deleteKeyStore = (namespace: Namespace): Effect<SharedEnv, Option<SharedKeyStore>> =>
  doEffect(function* () {
    const keyStores = yield* getKeyStores
    const keyStore = keyStores.get(namespace)

    if (keyStore) {
      yield* sendSharedEvent({ type: 'namespace/deleted', namespace })
    }

    return fromNullable(keyStore)
  })
