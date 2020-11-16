import { deepEqualsEq } from '@typed/fp/common/exports'
import { Eq } from 'fp-ts/Eq'
import { pipe } from 'fp-ts/function'

import { fromMap } from './fromMap'
import { wrapMap } from './wrapMap'

/**
 * Helper for constructing a SharedMap with a handful of core operators.
 */
export const createMap = <K, V>(key: Eq<K> = deepEqualsEq, value: Eq<V> = deepEqualsEq) => <
  SK extends PropertyKey
>(
  sk: SK,
) => pipe(sk, fromMap(key, value), wrapMap)

export const foo = createMap<string, number>()('foo')
