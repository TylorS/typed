import { deepEqualsEq } from '@typed/fp/common'
import { ask, doEffect, Effect } from '@typed/fp/Effect'
import { Eq } from 'fp-ts/es6/Eq'

import { Channel, ChannelName } from '../Channel'
import { UseState } from '../useState'
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
  ): Effect<HookEnv & E1 & E2, UseState<A>> =>
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
        createEvent: <A>(value: A): ChannelUpdated<A> => ({
          type: HookEventType.UpdatedChannel,
          channel: name,
          hookEnvironment,
          value,
        }),
      })
    })
}
