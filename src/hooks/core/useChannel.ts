import { Arity1, deepEqualsEq } from '@typed/fp/common/exports'
import { doEffect, Effect, EnvOf, map } from '@typed/fp/Effect/exports'
import { identity } from 'fp-ts/lib/function'

import { Channel } from './Channel'
import { ChannelConsumer } from './ChannelConsumer'
import { checkIsConsumer, getChannelConsumer, setChannelConsumer } from './ChannelConsumers'
import { getChannelProvider } from './ChannelProviders'
import { getNextSymbol } from './getNextSymbol'
import { getHookEnv } from './HookEnvironment'

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

    if (!isConsumer) {
      yield* setChannelConsumer(channel.name, env.id, key, consumer)
    }

    return yield* map(consumer.selector, getA)
  })

  return eff
}
