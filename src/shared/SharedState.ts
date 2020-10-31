import { fromKey } from './fromKey'
import { Shared } from './Shared'
import { State } from './State'

export type SharedState<K extends PropertyKey, A, B = A> = Shared<
  K,
  Record<K, State<A, B>>,
  State<A, B>
>

/**
 * Constructor for requesting State<A, B> from the environment
 */
export const sharedState = <A, B = A>() => <K extends PropertyKey>(key: K): SharedState<K, A, B> =>
  fromKey<State<A, B>>()(key)
