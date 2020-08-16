import { doEffect, Effect } from '../Effect'
import { UuidEnv } from '../Uuid'
import { createHookEnvironment } from './createHookEnvironment'
import { HookEnv, HookEnvironment } from './HookEnvironment'
import { KeyManagerChannel, KeyManagerState } from './KeyManagerChannel'
import { useChannelValue } from './useChannel'

export function useKeyManager<E, A>(
  key: any,
  eff: Effect<E & HookEnv, A>,
): Effect<E & HookEnv & KeyManagerState & UuidEnv, A> {
  return doEffect(function* () {
    const keyManager = yield* useChannelValue(KeyManagerChannel)
    const hookEnvironment = yield* getOrCreateHookEnvironment(key, keyManager)
    const value = yield* hookEnvironment.runWith(eff)

    return value
  })
}

const getOrCreateHookEnvironment = (
  key: any,
  keyManager: Map<any, HookEnvironment>,
): Effect<UuidEnv, HookEnvironment> =>
  doEffect(function* () {
    if (keyManager.has(key)) {
      return keyManager.get(key)!
    }

    const env = yield* createHookEnvironment()

    keyManager.set(key, env)

    return env
  })
