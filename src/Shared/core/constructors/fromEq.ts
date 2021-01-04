import { asks } from '@fp/Effect/exports'
import { curry } from '@fp/lambda/exports'
import { Eq } from 'fp-ts/Eq'

import { Shared } from '../model/Shared'
import { SharedKey } from '../model/SharedKey'
import { createShared } from './createShared'

/**
 * Creates a Shared instance given an Eq instance and a key.
 */
export const fromEq = curry(
  <A, K extends PropertyKey>(eq: Eq<A>, key: K): Shared<SharedKey<K>, Record<K, A>, A> =>
    createShared(
      key,
      asks((e: Record<K, A>) => Reflect.get(e, key)),
      eq,
    ),
) as {
  <A, K extends PropertyKey>(eq: Eq<A>, key: K): Shared<SharedKey<K>, Record<K, A>, A>
  <A>(eq: Eq<A>): <K extends PropertyKey>(key: K) => Shared<SharedKey<K>, Record<K, A>, A>
}
