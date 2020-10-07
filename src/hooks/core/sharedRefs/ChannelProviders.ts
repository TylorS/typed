import { ask, doEffect, Effect, EnvOf, provide, use } from '@typed/fp/Effect/exports'
import { SchedulerEnv } from '@typed/fp/fibers/exports'
import { Channel, ChannelName } from '@typed/fp/hooks/core/types/Channel'
import {
  getHookEnv,
  HookEnv,
  HookEnvironment,
  HookEnvironmentId,
} from '@typed/fp/hooks/core/types/HookEnvironment'
import {
  createSharedRef,
  readSharedRef,
  SharedRef,
  SharedRefEnv,
} from '@typed/fp/SharedRef/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { createState } from '../../helpers/createState'
import { findProvider } from '../../helpers/findProvider'
import { getOrSet } from '../../helpers/getOrSet'
import { ChannelUpdated, State } from '../types/exports'
import { HookEvents, sendHookEvent } from './HookEvents'

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
  EnvOf<typeof createState> &
    EnvOf<typeof getChannelProviders> &
    EnvOf<typeof setChannelProvider> &
    EnvOf<typeof getHookEnv> &
    E,
  readonly [HookEnvironment, State<A, A>]
> => {
  const eff = doEffect(function* () {
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

    return yield* pipe(setChannelProvider(channel, eq), use({ hookEnvironment: provider } as {}))
  })

  return eff
}

export const setChannelProvider = <E, A>(
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

    if (providers.has(hookEnvironment.id)) {
      return [hookEnvironment, providers.get(hookEnvironment.id)! as State<A, A>] as const
    }

    const state = yield* createState(channel.defaultValue, eq, (currentValue, updatedValue) =>
      pipe(
        ChannelUpdated.of({
          channel: channel.name,
          hookEnvironment,
          currentValue,
          updatedValue,
        }),
        sendHookEvent,
        provide(env),
      ),
    )

    providers.set(hookEnvironment.id, state)

    return [hookEnvironment, state] as const
  })

  return eff
}

export const checkIsProvider = (
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
