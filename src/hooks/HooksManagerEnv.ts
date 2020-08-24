import { Uuid } from '@typed/fp/Uuid'
import { Subject } from 'most-subject'

import { ChannelName } from './Channel'
import { HookEvent } from './events'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export interface HooksManagerEnv extends HookEnv {
  readonly hookEvents: HookEvents
  readonly hookPositions: Map<Uuid, number>
  readonly channelProviders: Map<ChannelName, Set<HookEnvironment>>
  readonly channelConsumers: Map<ChannelName, Set<HookEnvironment>>
}

export type HookEvents = Subject<HookEvent, HookEvent>
