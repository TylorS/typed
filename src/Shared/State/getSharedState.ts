import { doEffect, Effect } from '@typed/fp/Effect/exports'
import {
  getCurrentNamespace,
  getKeyStore,
  getOrCreate,
  getSendSharedEvent,
  getShared,
  GetSharedEnv,
  GetSharedValue,
  setShared,
  Shared,
  SharedEnv,
} from '@typed/fp/Shared/core/exports'

import { SharedStates } from './NamespaceStates'
import { State } from './State'

/**
 * Get a Shared value as a State object
 */
export const getSharedState = <S extends Shared>(
  shared: S,
): Effect<SharedEnv & GetSharedEnv<S>, State<GetSharedValue<S>>> =>
  doEffect(function* () {
    return yield* getOrCreate(yield* getShared(SharedStates), shared.key, () =>
      createSharedState(shared),
    )
  })

function createSharedState<S extends Shared>(shared: S) {
  const eff = doEffect(function* () {
    const namespace = yield* getCurrentNamespace
    const keyStore = yield* getKeyStore
    const initial = keyStore.has(shared.key) ? keyStore.get(shared.key) : yield* shared.initial
    const sendSharedEvent = yield* getSendSharedEvent

    if (!keyStore.has(shared.key)) {
      yield* setShared(shared, initial)
    }

    const get = (): GetSharedValue<S> =>
      keyStore.has(shared.key)
        ? keyStore.get(shared.key)!
        : keyStore.set(shared.key, initial).get(shared.key)!

    const set = (value: GetSharedValue<S>) => {
      const current = get()

      keyStore.set(shared.key, value)

      if (!shared.eq.equals(current, value)) {
        sendSharedEvent({
          type: 'sharedValue/updated',
          namespace,
          shared,
          previousValue: current,
          value,
        })
      }

      return value
    }

    const state: State<GetSharedValue<S>> = [get, set]

    return state
  })

  return eff
}
