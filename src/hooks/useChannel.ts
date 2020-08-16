import { doEffect, Effect } from '../Effect'
import { Channel } from './Channel'
import { HookEnv, UseState } from './HookEnvironment'
import { withHookEnv } from './withHookEnv'

export function useChannel<E1, A>(channel: Channel<E1, A>): Effect<E1 & HookEnv, UseState<A>>

export function useChannel<E1, A, E2>(
  channel: Channel<E1, A>,
  initialState: Effect<E2, A>,
): Effect<E1 & E2 & HookEnv, UseState<A>>

export function useChannel<E1, A, E2>(
  channel: Channel<E1, A>,
  initialState?: Effect<E2, A>,
): Effect<E1 & E2 & HookEnv, UseState<A>> {
  return withHookEnv(({ useChannel }) => useChannel(channel, initialState))
}

export function useChannelValue<E, A>(channel: Channel<E, A>): Effect<E & HookEnv, A> {
  return doEffect(function* () {
    const [getValue] = yield* useChannel<E, A>(channel)

    return yield* getValue
  })
}
