import { deepEqualsEq } from '@typed/fp/common/exports'
import { ask, doEffect, Effect } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { Channel, ChannelName, GetAndUpdateState } from '../domain/exports'
import { createUseState } from './createUseState'
import { ChannelUpdated, HookEvent, HookEventType } from './events'
import { appendTo } from './helpers'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export function createProvideChannel(
  channelProviders: Map<ChannelName, Set<HookEnvironment>>,
  sendEvent: (event: HookEvent) => void,
) {
  return <E1, A, E2>(
    channel: Channel<E1, A>,
    initialValue: Effect<E2, A>,
    eq: Eq<A> = deepEqualsEq,
  ): Effect<HookEnv & E1 & E2, GetAndUpdateState<A>> =>
    doEffect(function* () {
      const { hookEnvironment } = yield* ask<HookEnv>()
      const { channelStates } = hookEnvironment
      const { name } = channel

      appendTo(channelProviders, name, hookEnvironment)

      if (channelStates.has(name)) {
        return channelStates.get(name)!
      }

      return yield* createUseState({
        states: channelStates,
        initialValue,
        key: name,
        eq,
        sendEvent,
        createEvent: <A>(currentValue: A, updatedValue: A): ChannelUpdated<A> => ({
          type: HookEventType.UpdatedChannel,
          channel: name,
          hookEnvironment,
          currentValue,
          updatedValue,
        }),
      })
    })
}
