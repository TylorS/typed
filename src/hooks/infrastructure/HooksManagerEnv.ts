import { Arity1 } from '@typed/fp/common'
import { Uuid } from '@typed/fp/Uuid'
import { Subject } from 'most-subject'

import { ChannelName } from '../domain'
import { HookEvent } from './events'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export interface HooksManagerEnv extends HookEnv {
  readonly hookEvents: HookEvents
  readonly hookPositions: Map<Uuid, number>
  readonly channelProviders: Map<ChannelName, Set<HookEnvironment>>
  readonly channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>
}

export type HookEvents = Subject<HookEvent, HookEvent>
