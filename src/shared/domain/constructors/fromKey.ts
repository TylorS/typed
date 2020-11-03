import { deepEqualsEq } from '@typed/fp/common/exports'
import { Shared, SharedKey } from '@typed/fp/Shared/domain/model/exports'

import { fromEq } from './fromEq'

/**
 * Create a Shared instance from just a Key, using a deep equalily check.
 */
export const fromKey = <A>() => <K extends PropertyKey>(
  key: K,
): Shared<SharedKey, Record<K, A>, A> => fromEq<A, K>(deepEqualsEq, key)
