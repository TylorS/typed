import { deepEqualsEq } from '@typed/fp/common/exports'
import { Eq } from 'fp-ts/Eq'

import { fromSet } from './fromSet'
import { wrapSet } from './wrapSet'

/**
 * Create a Shared Set
 */
export const createSet = <V>(value: Eq<V> = deepEqualsEq) => <K extends PropertyKey>(key: K) =>
  wrapSet(fromSet(value)(key))
