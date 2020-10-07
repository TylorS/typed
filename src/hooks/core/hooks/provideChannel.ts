import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, EnvOf } from '@typed/fp/Effect/Effect'
import { doEffect } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'

import { setChannelProvider } from '../sharedRefs/exports'
import { respondToChannelUpdates } from '../sharedRefs/respondToChannelUpdates'
import { Channel } from '../types/Channel'
import { getHookEnv } from '../types/HookEnvironment'
import { State } from '../types/State'

export function provideChannel<E, A>(
  channel: Channel<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Effect<
  E & EnvOf<typeof setChannelProvider> & EnvOf<typeof respondToChannelUpdates>,
  State<A, A>
> {
  const eff = doEffect(function* () {
    const env = yield* getHookEnv
    const [, state] = yield* setChannelProvider(channel, eq)

    yield* respondToChannelUpdates(channel.name, env.id)

    return state
  })

  return eff
}
