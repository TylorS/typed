import { Arity1, deepEqualsEq } from '@typed/fp/common/exports'

import { ChannelName } from '../domain/exports'
import { ChannelUpdated } from './events'
import { HookEnvironment } from './HookEnvironment'

export function handleChannelUpdateEvent(
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
