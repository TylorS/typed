import { doEffect } from '@typed/fp/Effect/exports'
import { sendSharedEvent } from '@typed/fp/Shared/domain/events/exports'
import { Namespace } from '@typed/fp/Shared/domain/model/exports'
import { fromNullable } from 'fp-ts/Option'

import { getKeyStores } from './getKeyStores'

/**
 * Delete a Namespace from NamespaceKeyStores, sending out a Deleted
 * event.
 */
export const deleteKeyStore = (namespace: Namespace) =>
  doEffect(function* () {
    const keyStores = yield* getKeyStores
    const keyStore = keyStores.get(namespace)

    if (keyStore) {
      yield* sendSharedEvent({ type: 'namespace/deleted', namespace })
    }

    return fromNullable(keyStore)
  })
