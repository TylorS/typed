import { asks, Effect } from '@typed/fp/Effect'

import { createChannel } from './Channel'
import { HookEnvironment } from './HookEnvironment'
import { useChannel } from './useChannel'

export interface KeyManagerState {
  readonly hookEnvironments: Map<any, HookEnvironment>
}

export const KeyManagerChannel = createChannel(asks((e: KeyManagerState) => e.hookEnvironments))

const initial = Effect.fromIO(() => new Map<any, HookEnvironment>())

/**
 * Allow creating isolated KeyManager contexts
 */
export const provideKeyManager = <E>(
  hookEnvironments: Effect<E, Map<any, HookEnvironment>> = initial,
) => useChannel(KeyManagerChannel, hookEnvironments)
