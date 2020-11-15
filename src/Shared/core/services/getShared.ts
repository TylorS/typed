import { doEffect, Effect } from '@typed/fp/Effect/exports'

import { sendSharedEvent } from '../events/exports'
import { GetSharedEnv, GetSharedValue, Shared } from '../model/Shared'
import { getCurrentNamespace } from './getCurrentNamespace'
import { getKeyStore } from './getKeyStore'
import { getOrCreate } from './getOrCreate'
import { SharedEnv } from './SharedEnv'

export function getShared<S extends Shared>(
  shared: S,
): Effect<SharedEnv & GetSharedEnv<S>, GetSharedValue<S>> {
  const eff = doEffect(function* () {
    const keyStore = yield* getKeyStore
    const value = yield* getOrCreate(keyStore, shared.key, () => createShared(shared))

    return value as GetSharedValue<S>
  })

  return eff
}

const createShared = <S extends Shared>(shared: S) =>
  doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const value = yield* shared.initial

    yield* sendSharedEvent({ type: 'sharedValue/created', shared, namespace, value })

    return value
  })
