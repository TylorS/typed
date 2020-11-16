import { deepEqualsEq } from '@typed/fp/common/exports'
import { Pure } from '@typed/fp/Effect/exports'
import { Eq } from 'fp-ts/Eq'
import { getEq } from 'fp-ts/ReadonlyMap'

import { createShared, SharedKey } from '../core/exports'
import { SharedMap } from './SharedMap'

/**
 * Constructor a SharedMap that requires being provided by the environment.
 */
export const fromMap = <K, V>(key: Eq<K> = deepEqualsEq, value: Eq<V> = deepEqualsEq) => <
  SK extends PropertyKey
>(
  sk: SK,
): SharedMap<SharedKey<SK>, K, V> =>
  createShared(
    sk,
    Pure.fromIO((): ReadonlyMap<K, V> => new Map()),
    getEq(key, value),
  )
