import { Effect } from '@typed/fp/Effect/Effect'
import { Eq, eqStrict } from 'fp-ts/Eq'

import { Shared } from '../model/Shared'
import { SharedKey } from '../model/SharedKey'

/**
 * Contstruct a share value
 */
export function shared<K extends PropertyKey, E, A>(
  key: K,
  initial: Effect<E, A>,
  eq: Eq<A> = eqStrict,
): Shared<SharedKey<K>, E, A> {
  return {
    key: SharedKey.wrap(key) as SharedKey<K>,
    initial,
    eq,
  }
}
