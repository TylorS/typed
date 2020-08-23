import { Effect } from '@typed/fp/Effect'
import { iso, Newtype } from 'newtype-ts'

/**
 * A Channel is used by reference
 */
export interface Channel<E, A> {
  readonly name: ChannelName
  readonly defaultValue: Effect<E, A>
}

export interface ChannelName extends Newtype<{ readonly ChannelName: unique symbol }, string> {}

export const channelNameIso = iso<ChannelName>()

export function createChannel<E, A>(name: string, defaultValue: Effect<E, A>): Channel<E, A> {
  return {
    name: createChannelName(name),
    defaultValue,
  }
}

export const createChannelName = (name: string): ChannelName => channelNameIso.wrap(name)
export const readChannelName = (name: ChannelName): string => channelNameIso.unwrap(name)
