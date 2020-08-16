import { asks } from '@typed/fp/Effect'

import { createChannel } from './Channel'
import { HookEnvironment } from './HookEnvironment'

export interface KeyManagerState {
  readonly hookEnvironments: Map<any, HookEnvironment>
}

export const KeyManagerChannel = createChannel(asks((e: KeyManagerState) => e.hookEnvironments))
