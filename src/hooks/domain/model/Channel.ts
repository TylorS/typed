import { Effect } from '@typed/fp/Effect/exports'
import { Newtype } from 'newtype-ts'

/**
 * A Channel is used by reference
 */
export interface Channel<E, A> {
  readonly name: ChannelName
  readonly defaultValue: Effect<E, A>
}

export interface ChannelName extends Newtype<{ readonly ChannelName: unique symbol }, string> {}
