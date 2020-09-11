import { Arity1 } from '@typed/fp/common/exports'
import { LazyDisposable } from '@typed/fp/Disposable/exports'
import { Uuid } from '@typed/fp/Uuid/exports'
import { Subject } from 'most-subject'

import { ChannelName } from '../domain/exports'
import { HookEvent } from './events'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export interface HooksManagerEnv extends HookEnv {
  readonly hookEvents: HookEvents
  readonly hookPositions: Map<Uuid, number>
  readonly channelProviders: Map<ChannelName, Set<HookEnvironment>>
  readonly channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>
  readonly disposables: Map<HookEnvironment, LazyDisposable>
}

export type HookEvents = Subject<HookEvent, HookEvent>
