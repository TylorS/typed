import { Arity1 } from '@typed/fp/common/exports'
import { LazyDisposable } from '@typed/fp/Disposable/exports'
import { Uuid } from '@typed/fp/Uuid/exports'
import { pipe } from 'fp-ts/es6/function'
import { fold } from 'fp-ts/es6/Option'

import { ChannelName } from '../domain/exports'
import { RemovedHookEnvironment } from './events'
import { HookEnvironment } from './HookEnvironment'

export function handleRemoveEvent(
  hookPositions: Map<Uuid, number>,
  disposables: Map<HookEnvironment, LazyDisposable>,
  channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>,
  channelProviders: Map<ChannelName, Set<HookEnvironment>>,
) {
  return ({ hookEnvironment }: RemovedHookEnvironment) => {
    const { id, channelStates, parent, states } = hookEnvironment

    disposables.get(hookEnvironment)?.dispose()
    disposables.delete(hookEnvironment)

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
