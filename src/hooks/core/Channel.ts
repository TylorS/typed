import { Effect } from '@typed/fp/Effect/exports'
import { iso, Newtype } from 'newtype-ts'

/**
 * A Channel is used by reference
 */
export interface Channel<E, A> {
  readonly name: ChannelName
  readonly defaultValue: Effect<E, A>
}

export interface ChannelName extends Newtype<{ readonly ChannelName: unique symbol }, string> {}

export namespace ChannelName {
  export const { wrap, unwrap } = iso<ChannelName>()
}

export function createChannel<E, A>(name: string, defaultValue: Effect<E, A>): Channel<E, A> {
  return {
    name: ChannelName.wrap(name),
    defaultValue,
  }
}
