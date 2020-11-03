import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { sendSharedEvent } from '../events/exports'
import { Shared, ValueOf } from '../model/exports'
import { SharedEnv } from '../SharedEnv'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getOrCreate } from './getOrCreate'
import { withKeyStore } from './withKeyStore'

export const getShared = <S extends Shared>(shared: S): Effect<SharedEnv, ValueOf<S>> =>
  withKeyStore(function* (keyStore) {
    return yield* getOrCreate(keyStore, shared.key, createShared(shared))
  })

const createShared = <S extends Shared>(shared: S) =>
  doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const value = yield* shared.initial

    yield* sendSharedEvent({ type: 'sharedValue/created', shared, namespace, value })

    return value
  })
