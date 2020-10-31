import { deepEqualsEq } from '@typed/fp/common/exports'
import { asks } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'

import { Shared, shared } from './Shared'

/**
 * Create a Shared instance from just a Key, using a deep equalily check
 */
export const fromKey = <A>() => <K extends PropertyKey>(key: K): Shared<K, Record<K, A>, A> =>
  withEq<A, K>(deepEqualsEq, key)

/**
 * Creates a Shared instance given an Eq instance and a key.
 */
export const withEq = curry(
  <A, K extends PropertyKey>(eq: Eq<A>, key: K): Shared<K, Record<K, A>, A> =>
    shared(
      key,
      asks((e: Record<K, A>) => e[key]),
      eq,
    ),
) as {
  <A, K extends PropertyKey>(eq: Eq<A>, key: K): Shared<K, Record<K, A>, A>
  <A, K extends PropertyKey>(eq: Eq<A>): (key: K) => Shared<K, Record<K, A>, A>
}
