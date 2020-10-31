import { doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'

import { Shared, ValueOf } from './Shared'
import { getCurrentNamespace, getNamespace, sendSharedEvent, SharedEnv } from './SharedEnv'

/**
 * Gets a shared piece of state or creates if not currently present
 */
export const getShared = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & EnvOf<Shared['initial']>, ValueOf<S>> => {
  const eff = doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const map = yield* getNamespace(namespace)

    if (map.has(shared.key)) {
      return map.get(shared.key)!
    }

    const value = yield* shared.initial

    map.set(shared.key, value)

    yield* sendSharedEvent({ type: 'sharedValue/created', namespace, shared, value })

    return value
  })

  return eff
}
