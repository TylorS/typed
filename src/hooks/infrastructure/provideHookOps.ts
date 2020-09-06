import { filter } from '@most/core'
import { Stream } from '@most/types'
import { ask, doEffect } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { provideOpGroup } from '@typed/fp/Op/provideOpGroup'
import { pipe } from 'fp-ts/es6/function'
import { constant } from 'fp-ts/es6/function'

import { HookOps } from '../domain'
import { HookEnvironment } from '.'
import { createEventSink } from './createEventSink'
import { createGetKeyedEnv } from './createGetKeyedEnv'
import { createHookRequirements } from './createHookRequirements'
import { createProvideChannel } from './createProvideChannel'
import { createRemoveKeyedEnv } from './createRemoveKeyedEnv'
import { createRunWithHooks } from './createRunWithHooks'
import { createUseChannel } from './createUseChannel'
import { createUseRefByIndex } from './createUseRefByIndex'
import { createUseStateByIndex } from './createUseStateByIndex'
import {
  HookEvent,
  HookEventType,
  isRemovedHookEnvironmentEvent,
  isUpdatedChannelEvent,
} from './events'
import { handleChannelUpdateEvent } from './handleChannelUpdateEvent'
import { handleRemoveEvent } from './handleRemoveEvent'
import { HooksManagerEnv } from './HooksManagerEnv'

/**
 * Provides a default implementation of all of the base hook operations around a `HookEnv`
 */
export const provideHookOps = provideOpGroup(
  HookOps,
  doEffect(function* () {
    const {
      hookEnvironment,
      hookPositions,
      channelConsumers,
      channelProviders,
      hookEvents,
      scheduler,
    } = yield* ask<HooksManagerEnv & SchedulerEnv>()

    const [sink, stream] = hookEvents

    const removeEvents = pipe(stream, filter(isRemovedHookEnvironmentEvent))
    const channelUpdateEvents = pipe(stream, filter(isUpdatedChannelEvent))

    const sendEvent = (event: HookEvent) => sink.event(scheduler.currentTime(), event)

    const listenTo = <A>(stream: Stream<A>, f: (value: A) => void) =>
      hookEnvironment.addDisposable(stream.run(createEventSink(f), scheduler))

    const updateChild = (hookEnvironment: HookEnvironment) =>
      sendEvent({ type: HookEventType.UpdatedEnvironment, hookEnvironment })

    listenTo(removeEvents, handleRemoveEvent(hookPositions, channelConsumers, channelProviders))

    listenTo(
      channelUpdateEvents,
      handleChannelUpdateEvent(channelConsumers, channelProviders, updateChild),
    )

    const useRefByIndex = createUseRefByIndex(hookPositions)
    const useStateByIndex = createUseStateByIndex(hookPositions, sendEvent)
    const provideChannel = createProvideChannel(channelProviders, sendEvent)
    const useChannel = createUseChannel(hookEnvironment, channelConsumers, provideChannel)
    const runWithHooks = createRunWithHooks(hookPositions, sendEvent)
    const getKeyedEnv = createGetKeyedEnv(sendEvent)
    const removedKeyedEnv = createRemoveKeyedEnv(sendEvent)

    return [
      useRefByIndex,
      useStateByIndex,
      useChannel,
      provideChannel,
      runWithHooks,
      getKeyedEnv,
      removedKeyedEnv,
      constant(createHookRequirements),
    ] as const
  }),
)
