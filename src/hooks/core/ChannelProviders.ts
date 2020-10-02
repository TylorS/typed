import { ask, doEffect, Effect, EnvOf, provide } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { Channel, ChannelName } from '@typed/fp/hooks/core/Channel'
import {
  getHookEnv,
  HookEnv,
  HookEnvironment,
  HookEnvironmentId,
} from '@typed/fp/hooks/core/HookEnvironment'
import {
  createSharedRef,
  readSharedRef,
  SharedRef,
  SharedRefEnv,
} from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'
import { isSome } from 'fp-ts/Option'

import { getOrSet } from '../helpers/getOrSet'
import { createState } from './createState'
import { ChannelUpdated } from './events'
import { HookEvents, sendHookEvent } from './HookEvents'
import { State } from './State'

export const CHANNEL_PROVIDERS = '@typed/fp/ChannelProviders'
export type CHANNEL_PROVIDERS = typeof CHANNEL_PROVIDERS

export interface ChannelProviders
  extends SharedRef<CHANNEL_PROVIDERS, Map<ChannelName, Map<HookEnvironmentId, State<any, any>>>> {}

export const ChannelProviders = createSharedRef<ChannelProviders>(CHANNEL_PROVIDERS)

export const getChannelProviders = readSharedRef(ChannelProviders)

export const getChannelProvider = <E, A>(
  channel: Channel<E, A>,
  eq: Eq<A>,
): Effect<
  E &
    HookEnv &
    EnvOf<typeof sendHookEvent> &
    EnvOf<typeof getChannelProviders> &
    EnvOf<typeof createState>,
  readonly [HookEnvironment, State<A, A>]
> => {
  const eff = doEffect(function* () {
    const env = yield* ask<SchedulerEnv & SharedRefEnv<HookEvents>>()
    const hookEnvironment = yield* getHookEnv
    const channelProviders = yield* getChannelProviders
    const providers = getOrSet(
      channel.name,
      channelProviders,
      (): Map<HookEnvironmentId, State<any, any>> => new Map(),
    )
    const provider = findProvider(hookEnvironment, providers)

    if (providers.has(provider.id)) {
      return [provider, providers.get(provider.id)! as State<A, A>] as const
    }

    const state = yield* createState(channel.defaultValue, eq, (currentValue, updatedValue) =>
      pipe(
        ChannelUpdated.of({
          channel: channel.name,
          hookEnvironment: provider,
          currentValue,
          updatedValue,
        }),
        sendHookEvent,
        provide(env),
      ),
    )

    providers.set(provider.id, state)

    return [provider, state] as const
  })

  return eff
}

function findProvider(
  env: HookEnvironment,
  providers: Map<HookEnvironmentId, State<any, any>>,
): HookEnvironment {
  let current = env

  while (!providers.has(current.id) && isSome(current.parent)) {
    current = current.parent.value
  }

  return current
}

export const isProvider = (
  channel: ChannelName,
  id: HookEnvironmentId,
): Effect<SharedRefEnv<ChannelProviders>, boolean> => {
  const eff = doEffect(function* () {
    const providers = yield* getChannelProviders

    return providers.get(channel)?.has(id) ?? false
  })

  return eff
}

export const deleteChannelProvider = (
  id: HookEnvironmentId,
): Effect<SharedRefEnv<ChannelProviders>, void> => {
  const eff = doEffect(function* () {
    const providers = yield* getChannelProviders

    providers.forEach((hooks) => hooks.delete(id))
  })

  return eff
}
