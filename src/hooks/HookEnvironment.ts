import { IORef } from 'fp-ts/es6/IORef'
import { Option } from 'fp-ts/es6/Option'

import { Arity1 } from '../common'
import { Effect, FiberEnv, Pure, SchedulerEnv } from '../Effect'
import { Uuid } from '../Uuid'
import { Channel } from './Channel'
import { HookEvents } from './hookEvents'

export interface HookEnv {
  readonly hookEnvironment: HookEnvironment
}

export interface HookEnvironment {
  readonly id: Uuid

  readonly parent: Option<HookEnvironment>

  readonly events: HookEvents

  readonly needsUpdate: boolean

  readonly runWith: <E, A>(eff: Effect<E & HookEnv, A>) => Effect<E, A>

  readonly useRef: <E, A>(initialState: Effect<E, A>) => Effect<E, IORef<A>>

  readonly useState: <E, A>(initialState: Effect<E, A>) => Effect<E & SchedulerEnv, UseState<A>>

  readonly useChannel: <E1, A, E2>(
    channel: Channel<E1, A>,
    initialState?: Effect<E2, A>,
  ) => Effect<E1 & E2 & FiberEnv, UseState<A>>
}

export type UseState<A> = readonly [Pure<A>, UpdateState<A>]
export type UpdateState<A> = <E>(update: Arity1<A, Effect<E, A>>) => Effect<E, A>
