import { Arity1, deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, EnvOf } from '@typed/fp/Effect/exports'
import { getTupleEq } from 'fp-ts/Eq'
import { identity } from 'fp-ts/function'

import {
  checkIsConsumer,
  getChannelConsumer,
  setChannelConsumer,
} from '../sharedRefs/ChannelConsumers'
import { getChannelProvider } from '../sharedRefs/ChannelProviders'
import { getNextSymbol } from '../sharedRefs/getNextSymbol'
import { Channel } from '../types/Channel'
import { ChannelConsumer } from '../types/ChannelConsumer'
import { getHookEnv } from '../types/HookEnvironment'
import { useMemo } from './useMemo'

export function useChannel<E, A>(
  channel: Channel<E, A>,
): Effect<
  E &
    EnvOf<typeof getHookEnv> &
    EnvOf<typeof getChannelProvider> &
    EnvOf<typeof getChannelConsumer>,
  A
>

export function useChannel<E, A, B>(
  channel: Channel<E, A>,
  consumer: ChannelConsumer<A, B>,
): Effect<
  E &
    EnvOf<typeof getHookEnv> &
    EnvOf<typeof getChannelProvider> &
    EnvOf<typeof getChannelConsumer>,
  B
>

export function useChannel<E, A, B = A>(
  channel: Channel<E, A>,
  consumer: ChannelConsumer<A, B> = { selector: identity as Arity1<A, B>, eq: deepEqualsEq },
): Effect<
  E &
    EnvOf<typeof getHookEnv> &
    EnvOf<typeof getNextSymbol> &
    EnvOf<typeof getChannelProvider> &
    EnvOf<typeof getChannelConsumer>,
  B
> {
  const eff = doEffect(function* () {
    const env = yield* getHookEnv
    const key = yield* getNextSymbol(env.id)
    const [, [getA]] = yield* getChannelProvider(channel, deepEqualsEq)
    const isConsumer = yield* checkIsConsumer(channel.name, env.id)
    const b = consumer.selector(getA())
    const tupleEq = yield* useMemo(getTupleEq, [consumer.eq])
    const stable = yield* useMemo(identity, [b], tupleEq)

    if (!isConsumer) {
      yield* setChannelConsumer(channel.name, env.id, key, consumer)
    }

    return stable
  })

  return eff
}
