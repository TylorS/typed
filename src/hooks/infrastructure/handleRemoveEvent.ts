import { Arity1 } from '@typed/fp/common'
import { Uuid } from '@typed/fp/Uuid'
import { pipe } from 'fp-ts/es6/function'
import { fold } from 'fp-ts/es6/Option'

import { ChannelName } from '../domain'
import { RemovedHookEnvironment } from './events'
import { HookEnvironment } from './HookEnvironment'

export function handleRemoveEvent(
  hookPositions: Map<Uuid, number>,
  channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>,
  channelProviders: Map<ChannelName, Set<HookEnvironment>>,
) {
  return ({ hookEnvironment }: RemovedHookEnvironment) => {
    const { id, channelStates, parent, states } = hookEnvironment

    channelStates.forEach((_, name) => {
      channelConsumers.get(name)?.delete(hookEnvironment)
      channelProviders.get(name)?.delete(hookEnvironment)
    })

    hookPositions.delete(id)
    states.clear()
    channelStates.clear()

    pipe(
      parent,
      fold(
        () => void 0,
        ({ children }) => children.delete(id),
      ),
    )

    hookEnvironment.dispose()
  }
}
