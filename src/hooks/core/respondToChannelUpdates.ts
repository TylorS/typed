import { disposeNone } from '@most/disposable'
import { Disposable } from '@most/types'
import { ask, chain, doEffect, Effect, EnvOf, execPure, use, zip } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { propEq } from '@typed/fp/logic/exports'
import { SharedRefEnv } from '@typed/fp/SharedRef/exports'
import { pipe } from 'fp-ts/function'

import { ChannelName } from './Channel'
import { ChannelConsumers, checkIsConsumer, getChannelConsumers } from './ChannelConsumers'
import { ChannelProviders, checkIsProvider } from './ChannelProviders'
import { isUpdatedChannelEvent, UpdatedHookEnvironment } from './events'
import { HookEnvironment, HookEnvironmentId } from './HookEnvironment'
import { HookEvents, listenToHookEvents, sendHookEvent } from './HookEvents'

/**
 * Listens for channel updates orignating from a given provider, traversing
 * it's descendants sending hook update events for all needing to be updated
 */
export const respondToChannelUpdates = (
  channelName: ChannelName,
  provider: HookEnvironmentId,
): Effect<
  EnvOf<typeof listenToHookEvents> &
    EnvOf<typeof updateConsumer> &
    EnvOf<typeof getAllConsumerDescendants>,
  Disposable
> => {
  const eff = doEffect(function* () {
    const env = yield* ask<EnvOf<typeof getAllConsumerDescendants> & EnvOf<typeof updateConsumer>>()

    const disposable = yield* listenToHookEvents(isUpdatedChannelEvent, (event) => {
      const { hookEnvironment, currentValue, updatedValue } = event
      const isChannelName = propEq('channel', channelName)
      const isHookId = propEq('id', provider)

      if (!isChannelName(event) || !isHookId(hookEnvironment)) {
        return disposeNone()
      }

      return pipe(
        getAllConsumerDescendants(channelName, hookEnvironment),
        chain((hookEnvironments) =>
          zip(hookEnvironments.map(updateConsumer(channelName, currentValue, updatedValue))),
        ),
        use(env),
        execPure,
      )
    })

    return disposable
  })

  return eff
}

const updateConsumer = (channelName: ChannelName, currentValue: any, updatedValue: any) => (
  hookEnvironment: HookEnvironment,
): Effect<SchedulerEnv & SharedRefEnv<HookEvents> & SharedRefEnv<ChannelConsumers>, void> =>
  doEffect(function* () {
    const channelConsumers = yield* getChannelConsumers
    const consumers = [
      ...(channelConsumers.get(channelName)?.get(hookEnvironment.id)?.values() ?? []),
    ]

    for (const { selector, eq } of consumers) {
      const current = selector(currentValue)
      const updated = selector(updatedValue)

      if (!eq.equals(current, updated)) {
        yield* sendHookEvent(UpdatedHookEnvironment.of(hookEnvironment))

        // We only need to find one that needs updating
        break
      }
    }
  })

const getAllConsumerDescendants = (
  channel: ChannelName,
  env: HookEnvironment,
): Effect<
  SharedRefEnv<ChannelProviders> & SharedRefEnv<ChannelConsumers>,
  readonly HookEnvironment[]
> =>
  doEffect(function* () {
    const children = [...env.children.values()]
    const matches: HookEnvironment[] = []

    while (children.length > 0) {
      const child = children.shift()!
      const isProvider = yield* checkIsProvider(channel, child.id)
      const isConsumer = yield* checkIsConsumer(channel, child.id)

      // Don't continue past provider boundaries
      if (!isProvider) {
        // Check for updates if is a consumer
        if (isConsumer) {
          matches.push(child)
        }

        // Since we didn't find a boundary keep moving down the tree
        children.push(...child.children.values())
      }
    }

    return matches
  })
