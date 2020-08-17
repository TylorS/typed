import { filter } from '@most/core'
import { Disposable, Stream, Time } from '@most/types'
import { pipe } from 'fp-ts/es6/pipeable'
import { snd } from 'fp-ts/es6/ReadonlyTuple'
import { constVoid, Refinement } from 'fp-ts/lib/function'
import { Subject } from 'most-subject'

import { doEffectWith, Effect, FiberEnv, map, SchedulerEnv } from '../Effect'
import { Channel } from './Channel'
import { getHookEnv } from './getHookEnv'
import { HookEnv, HookEnvironment } from './HookEnvironment'
import { useDisposable } from './useDisposable'
import { useMemo } from './useMemo'

export const useHookEvents: Effect<HookEnv, Stream<HookEvent>> = pipe(
  getHookEnv,
  map((e) => snd(e.events)),
)

export const sendHookEvent = (event: HookEvent) =>
  doEffectWith(function* ({ scheduler }: SchedulerEnv) {
    const { events } = yield* getHookEnv
    const [sink] = events

    sink.event(scheduler.currentTime(), event)
  })

export function useOnHookEvent<A extends HookEvent>(
  refinement: Refinement<HookEvent, A>,
  event: (time: Time, event: A) => void,
): Effect<HookEnv & FiberEnv & SchedulerEnv, Disposable> {
  return doEffectWith(function* ({ scheduler }: SchedulerEnv) {
    const events = yield* useHookEvents
    const stream = yield* useMemo(filter(refinement), [events])

    return yield* useDisposable(
      (s) => s.run({ event, error: constVoid, end: constVoid }, scheduler),
      [stream],
    )
  })
}

export type HookEvents = Subject<HookEvent, HookEvent>

export type HookEvent = HookCreatedEvent | HookUpdatedEvent | HookRemovedEvent | ChannelUpdatedEvent

export type HookCreatedEvent = readonly [HookEventType.EnvironmentCreated, HookEnvironment]

export const isHookCreatedEvent: Refinement<HookEvent, HookCreatedEvent> = (
  e,
): e is HookCreatedEvent => e[0] === HookEventType.EnvironmentCreated

export type HookUpdatedEvent = readonly [
  HookEventType.EnvironmentUpdated,
  {
    readonly hookEnvironment: HookEnvironment
    readonly needsUpdate: boolean
  },
]

export const isHookUpdatedEvent: Refinement<HookEvent, HookUpdatedEvent> = (
  e,
): e is HookUpdatedEvent => e[0] === HookEventType.EnvironmentUpdated

export type HookRemovedEvent = readonly [HookEventType.EnvironmentRemoved, HookEnvironment]

export const isHookRemovedEvent: Refinement<HookEvent, HookRemovedEvent> = (
  e,
): e is HookRemovedEvent => e[0] === HookEventType.EnvironmentRemoved

export type ChannelUpdatedEvent = readonly [
  HookEventType.ChannelUpdated,
  {
    readonly channel: Channel<any, any>
    readonly hookEnvironment: HookEnvironment
  },
]

export const isChannelUpdateEvent: Refinement<HookEvent, ChannelUpdatedEvent> = (
  e,
): e is ChannelUpdatedEvent => e[0] === HookEventType.ChannelUpdated

export const enum HookEventType {
  EnvironmentCreated = 'environment/created',
  EnvironmentUpdated = 'environment/updated',
  EnvironmentRemoved = 'environment/removed',
  ChannelUpdated = 'channel/updated',
}
