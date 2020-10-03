import { doEffect, Effect } from '@typed/fp/Effect/exports'
import { ChannelName } from '@typed/fp/hooks/core/Channel'
import { HookEnvironmentId } from '@typed/fp/hooks/core/HookEnvironment'
import {
  createSharedRef,
  readSharedRef,
  SharedRef,
  SharedRefEnv,
} from '@typed/fp/SharedRef/exports'
import { eqStrict } from 'fp-ts/Eq'
import { lookup } from 'fp-ts/Map'
import { Option } from 'fp-ts/Option'

const find = lookup(eqStrict)

import { getOrSet } from '../helpers/getOrSet'
import { ChannelConsumer } from './ChannelConsumer'

export const CHANNEL_CONSUMERS = '@typed/fp/ChannelConsumers'
export type CHANNEL_CONSUMERS = typeof CHANNEL_CONSUMERS

export interface ChannelConsumers
  extends SharedRef<
    CHANNEL_CONSUMERS,
    Map<ChannelName, Map<HookEnvironmentId, Map<symbol, ChannelConsumer<any, any>>>>
  > {}

export const ChannelConsumers = createSharedRef<ChannelConsumers>(CHANNEL_CONSUMERS)

export const getChannelConsumers = readSharedRef(ChannelConsumers)

export const checkIsConsumer = (
  channel: ChannelName,
  id: HookEnvironmentId,
): Effect<SharedRefEnv<ChannelConsumers>, boolean> => {
  const eff = doEffect(function* () {
    const consumers = yield* getChannelConsumers

    return (consumers.get(channel)?.get(id)?.size ?? 0) > 0
  })

  return eff
}

export const getChannelConsumer = <A, B>(
  channelName: ChannelName,
  hookEnvironmentId: HookEnvironmentId,
  key: symbol,
): Effect<SharedRefEnv<ChannelConsumers>, Option<ChannelConsumer<A, B>>> => {
  const eff = doEffect(function* () {
    const consumersByChannel = yield* getChannelConsumers

    const hooks = getOrSet(
      channelName,
      consumersByChannel,
      (): Map<HookEnvironmentId, Map<symbol, ChannelConsumer<any, any>>> => new Map(),
    )

    const consumers = getOrSet(
      hookEnvironmentId,
      hooks,
      (): Map<symbol, ChannelConsumer<any, any>> => new Map(),
    )

    return find(key, consumers) as Option<ChannelConsumer<A, B>>
  })

  return eff
}

export const setChannelConsumer = (
  channelName: ChannelName,
  hookEnvironmentId: HookEnvironmentId,
  key: symbol,
  consumer: ChannelConsumer<any, any>,
): Effect<SharedRefEnv<ChannelConsumers>, void> => {
  const eff = doEffect(function* () {
    const consumersByChannel = yield* getChannelConsumers

    const hooks = getOrSet(
      channelName,
      consumersByChannel,
      (): Map<HookEnvironmentId, Map<symbol, ChannelConsumer<any, any>>> => new Map(),
    )

    const consumers = getOrSet(
      hookEnvironmentId,
      hooks,
      (): Map<symbol, ChannelConsumer<any, any>> => new Map(),
    )

    consumers.set(key, consumer)
  })

  return eff
}

export const deleteChannelConsumer = (
  id: HookEnvironmentId,
): Effect<SharedRefEnv<ChannelConsumers>, void> => {
  const eff = doEffect(function* () {
    const consumersByChannel = yield* getChannelConsumers

    consumersByChannel.forEach((hooks) => hooks.delete(id))
  })

  return eff
}
