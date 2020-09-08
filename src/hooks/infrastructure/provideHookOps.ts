import { filter } from '@most/core'
import { Disposable, Stream } from '@most/types'
import { Arity1, deepEqualsEq } from '@typed/fp/common'
import { lazy } from '@typed/fp/Disposable'
import { ask, doEffect } from '@typed/fp/Effect'
import { SchedulerEnv } from '@typed/fp/fibers'
import { provideOpGroup } from '@typed/fp/Op/provideOpGroup'
import { pipe } from 'fp-ts/es6/function'
import { constant } from 'fp-ts/es6/function'

import { ChannelName, HookOps } from '../domain'
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
  ChannelUpdated,
  HookEvent,
  HookEventType,
  isRemovedHookEnvironmentEvent,
  isUpdatedChannelEvent,
} from './events'
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
      disposables,
      channelConsumers,
      channelProviders,
      hookEvents,
      scheduler,
    } = yield* ask<HooksManagerEnv & SchedulerEnv>()

    const [sink, stream] = hookEvents

    const removeEvents = pipe(stream, filter(isRemovedHookEnvironmentEvent))
    const channelUpdateEvents = pipe(stream, filter(isUpdatedChannelEvent))

    const references = new Map<number, symbol>()
    const getReference = (index: number): symbol => {
      const symbol = references.get(index) ?? Symbol()

      references.set(index, symbol)

      return symbol
    }

    const sendEvent = (event: HookEvent) => sink.event(scheduler.currentTime(), event)

    const listenTo = <A>(stream: Stream<A>, f: (value: A) => void) =>
      hookEnvironment.addDisposable(stream.run(createEventSink(f), scheduler))

    const updateChild = (hookEnvironment: HookEnvironment) =>
      sendEvent({ type: HookEventType.UpdatedEnvironment, hookEnvironment })

    listenTo(
      removeEvents,
      handleRemoveEvent(hookPositions, disposables, channelConsumers, channelProviders),
    )

    listenTo(
      channelUpdateEvents,
      handleChannelUpdateEvent(channelConsumers, channelProviders, updateChild),
    )

    const useRefByIndex = createUseRefByIndex(hookPositions, getReference)
    const useStateByIndex = createUseStateByIndex(hookPositions, getReference, sendEvent)
    const provideChannel = createProvideChannel(channelProviders, sendEvent)
    const useChannel = createUseChannel(hookEnvironment, channelConsumers, provideChannel)
    const runWithHooks = createRunWithHooks(hookPositions, sendEvent)
    const getKeyedEnv = createGetKeyedEnv(sendEvent)
    const removedKeyedEnv = createRemoveKeyedEnv(sendEvent)

    const addDisposable = (disposable: Disposable) => {
      const eff = doEffect(function* () {
        const { hookEnvironment } = yield* ask()
        const { addDisposable } =
          disposables.get(hookEnvironment) ??
          disposables.set(hookEnvironment, lazy()).get(hookEnvironment)!

        return addDisposable(disposable)
      })

      return eff
    }

    return [
      useRefByIndex,
      useStateByIndex,
      useChannel,
      provideChannel,
      runWithHooks,
      getKeyedEnv,
      removedKeyedEnv,
      constant(createHookRequirements),
      addDisposable,
    ] as const
  }),
)

function handleChannelUpdateEvent(
  channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>,
  channelProviders: Map<ChannelName, Set<HookEnvironment>>,
  updateChild: (e: HookEnvironment) => void,
) {
  return (event: ChannelUpdated<unknown>) => {
    const { channel, hookEnvironment, currentValue, updatedValue } = event
    const consumers = channelConsumers.get(channel)!
    const providers = channelProviders.get(channel)!
    const descendants = getAllDescendants(providers, consumers, hookEnvironment)

    for (const child of descendants) {
      const selector = consumers.get(child)!
      const current = selector(currentValue)
      const updated = selector(updatedValue)

      if (!deepEqualsEq.equals(current, updated)) {
        updateChild(child)
      }
    }
  }
}

function* getAllDescendants(
  providers: Set<HookEnvironment>,
  consumers: Map<HookEnvironment, any>,
  node: HookEnvironment,
): Generator<HookEnvironment, void, any> {
  const children = node.children.values()

  if (!children) {
    return
  }

  for (const child of children) {
    // Don't continue past provider boundaries
    if (!providers.has(child)) {
      // Update if is a consumer
      if (consumers.has(child)) {
        yield child
      }

      // Continue down the tree
      yield* getAllDescendants(providers, consumers, child)
    }
  }
}
