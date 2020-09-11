import { Arity1, deepEqualsEq } from '@typed/fp/common/exports'
import { ask, doEffect, Effect, provide } from '@typed/fp/Effect/exports'
import { CallOf } from '@typed/fp/Op/exports'
import { identity, pipe } from 'fp-ts/es6/function'
import { fold, isSome, none, Option, some } from 'fp-ts/es6/Option'

import { Channel, ChannelName, ProvideChannelOp } from '../domain/exports'
import { HookEnv, HookEnvironment } from './HookEnvironment'

export function createUseChannel(
  rootHookEnvironment: HookEnvironment,
  channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>,
  provideChannelOp: CallOf<ProvideChannelOp, HookEnv>,
) {
  return <E, A, B = A>(
    channel: Channel<E, A>,
    selector: Arity1<A, B> = identity as Arity1<A, B>,
  ): Effect<E & HookEnv, A> =>
    doEffect(function* () {
      const env = yield* ask<HookEnv>()
      const { hookEnvironment } = env
      const { name } = channel

      addConsumer(channelConsumers, name, hookEnvironment, selector)

      const provider = findProvider(hookEnvironment, name)

      if (isSome(provider)) {
        return provider.value.channelStates.get(name)!
      }

      return yield* pipe(
        provideChannelOp(channel, channel.defaultValue, deepEqualsEq),
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

function addConsumer(
  channelConsumers: Map<ChannelName, Map<HookEnvironment, Arity1<any, any>>>,
  name: ChannelName,
  hookEnvironment: HookEnvironment,
  selector: Arity1<any, any>,
) {
  if (!channelConsumers.has(name)) {
    channelConsumers.set(name, new Map())
  }

  const consumers = channelConsumers.get(name)!

  consumers.set(hookEnvironment, selector)
}
