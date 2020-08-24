import { ask, doEffect, Effect, provide } from '@typed/fp/Effect'
import { CallOf } from '@typed/fp/Op'
import { eqStrict } from 'fp-ts/es6/Eq'
import { pipe } from 'fp-ts/es6/function'
import { fold, isSome, none, Option, some } from 'fp-ts/es6/Option'

import { Channel, ChannelName, HookEnv, HookEnvironment, ProvideChannelOp } from '../../domain'
import { appendTo } from './helpers'

export function createUseChannel(
  rootHookEnvironment: HookEnvironment,
  channelConsumers: Map<ChannelName, Set<HookEnvironment>>,
  provideChannelOp: CallOf<ProvideChannelOp, HookEnv>,
) {
  return <E, A>(channel: Channel<E, A>): Effect<E & HookEnv, A> =>
    doEffect(function* () {
      const env = yield* ask<HookEnv>()
      const { hookEnvironment } = env
      const { name } = channel

      appendTo(channelConsumers, name, hookEnvironment)

      const provider = findProvider(hookEnvironment, name)

      if (isSome(provider)) {
        return provider.value.channelStates.get(name)!
      }

      return yield* pipe(
        provideChannelOp(channel, channel.defaultValue, eqStrict),
        provide({ hookEnvironment: rootHookEnvironment }),
      ) as Effect<E, any>
    })
}

function findProvider(
  hookEnvironment: HookEnvironment,
  name: ChannelName,
): Option<HookEnvironment> {
  if (hookEnvironment.channelStates.has(name)) {
    return some(hookEnvironment)
  }

  return pipe(
    hookEnvironment.parent,
    fold(
      () => none,
      (e) => findProvider(e, name),
    ),
  )
}
