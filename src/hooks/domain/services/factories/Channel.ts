import { Effect } from '@typed/fp/Effect/exports'
import { iso } from 'newtype-ts'

import { Channel, ChannelName } from '../../model/exports'

export function createChannel<E, A>(name: string, defaultValue: Effect<E, A>): Channel<E, A> {
  return {
    name: createChannelName(name),
    defaultValue,
  }
}

export const channelNameIso = iso<ChannelName>()

export const createChannelName = (name: string): ChannelName => channelNameIso.wrap(name)

export const readChannelName = (name: ChannelName): string => channelNameIso.unwrap(name)
