import { deepEqualsEq } from '@typed/fp/common/exports'

import { Shared } from '../model/Shared'
import { SharedKey } from '../model/SharedKey'
import { fromEq } from './fromEq'

/**
 * Create a Shared instance from just a Key, using a deep equalily check.
 */
export const fromKey = <A>() => <K extends PropertyKey>(
  key: K,
): Shared<SharedKey<K>, Record<K, A>, A> => fromEq<A, K>(deepEqualsEq, key)
