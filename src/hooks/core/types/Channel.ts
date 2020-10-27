import { Effect } from '@typed/fp/Effect/exports'
import { iso, Newtype } from 'newtype-ts'

/**
 * A Channel is an abstraction used to represent shared state
 * that can be provided for at different levels in a tree of
 * hook environments.
 */
export interface Channel<E, A> {
  readonly name: ChannelName
  readonly defaultValue: Effect<E, A>
}

export interface ChannelName extends Newtype<'ChannelName', string> {}

export namespace ChannelName {
  export const { wrap, unwrap } = iso<ChannelName>()
}

export function createChannel<E, A>(name: string, defaultValue: Effect<E, A>): Channel<E, A> {
  return {
    name: ChannelName.wrap(name),
    defaultValue,
  }
}
