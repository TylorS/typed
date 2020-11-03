import { doEffect, Effect } from '@typed/fp/Effect/exports'
import {
  EnvOf,
  getCurrentNamespace,
  getKeyStore,
  getOrCreate,
  getSendSharedEvent,
  getShared,
  setShared,
  Shared,
  SharedEnv,
  ValueOf,
} from '@typed/fp/Shared/domain/exports'

import { State } from '../model/exports'
import { SharedStates } from '../model/NamespaceStates'

/**
 * Get a Shared value as a State object
 */
export const getSharedState = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & EnvOf<S>, State<ValueOf<S>>> => {
  const eff = doEffect(function* () {
    const states = yield* getShared(SharedStates)

    return yield* getOrCreate(states, shared.key, createSharedState(shared))
  })

  return eff
}

function createSharedState<S extends Shared>(shared: S) {
  const eff = doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const keyStore = yield* getKeyStore
    const initial = keyStore.has(shared.key) ? keyStore.get(shared.key) : yield* shared.initial
    const sendSharedEvent = yield* getSendSharedEvent

    if (!keyStore.has(shared.key)) {
      yield* setShared(shared, initial)
    }

    const get = (): ValueOf<S> =>
      keyStore.has(shared.key)
        ? keyStore.get(shared.key)!
        : keyStore.set(shared.key, initial).get(shared.key)!

    const set = (value: ValueOf<S>) => {
      const current = get()

      if (shared.eq.equals(current, value)) {
        return current
      }

      sendSharedEvent({
        type: 'sharedValue/updated',
        namespace,
        shared,
        previousValue: current,
        value,
      })

      return value
    }

    const state: State<ValueOf<S>> = [get, set]

    return state
  })

  return eff
}
