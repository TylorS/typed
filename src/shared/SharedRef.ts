import { fromKey } from './fromKey'
import { Ref } from './Ref'
import { Shared } from './Shared'

export type SharedRef<K extends PropertyKey, A> = Shared<K, Record<K, Ref<A>>, Ref<A>>

/**
 * Constructor for requesting Ref<A> from the environment
 */
export const sharedRef = <A>() => <K extends PropertyKey>(key: K): SharedRef<K, A> =>
  fromKey<Ref<A>>()(key)
