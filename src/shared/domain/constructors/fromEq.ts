import { asks } from '@typed/fp/Effect/exports'
import { curry } from '@typed/fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'

import { Shared } from '../model/Shared'
import { SharedKey } from '../model/SharedKey'
import { shared } from './shared'

/**
 * Creates a Shared instance given an Eq instance and a key.
 */
export const fromEq = curry(
  <A, K extends PropertyKey>(eq: Eq<A>, key: K): Shared<SharedKey, Record<K, A>, A> =>
    shared(
      key,
      asks((e: Record<K, A>) => Reflect.get(e, key)),
      eq,
    ),
) as {
  <A, K extends PropertyKey>(eq: Eq<A>, key: K): Shared<SharedKey, Record<K, A>, A>
  <A, K extends PropertyKey>(eq: Eq<A>): (key: K) => Shared<SharedKey, Record<K, A>, A>
}
