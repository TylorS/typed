import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { sendSharedEvent, SharedEventEnv } from '../events/SharedEventEnv'
import { SharedKeyStore } from '../model/exports'
import { CurrentNamespaceEnv } from './CurrentNamespaceEnv'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getKeyStores } from './getKeyStores'
import { getOrCreate } from './getOrCreate'
import { SharedEnv } from './SharedEnv'

export const getKeyStore: Effect<SharedEnv, SharedKeyStore> = doEffect(function* () {
  const namespace = yield* getCurrentNamespace
  const keyStores = yield* getKeyStores

  return yield* getOrCreate(keyStores, namespace, createNewKeyStore)
})

const createNewKeyStore = (): Effect<SharedEventEnv & CurrentNamespaceEnv, SharedKeyStore> =>
  doEffect(function* () {
    const namespace = yield* getCurrentNamespace

    yield* sendSharedEvent({ type: 'namespace/created', namespace })

    return new Map()
  })
