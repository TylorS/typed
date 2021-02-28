import { asks, Env } from '@typed/fp/Env'
import { deepEqualsEq } from '@typed/fp/Eq'
import { Eq } from 'fp-ts/Eq'

/**
 * The abstraction over a Shared Key-Value pair using Env
 * as the mechanism for retrieving the initial value if a
 * current value can not be found.
 */
export interface Shared<K, E, V> extends Eq<V> {
  readonly key: K
  readonly initial: Env<E, V>
}

/**
 * Construct a Shared instance
 */
export function createShared<K, E, V>(
  key: K,
  initial: Env<E, V>,
  eq: Eq<V> = deepEqualsEq,
): Shared<K, E, V> {
  return {
    key,
    initial,
    ...eq,
  }
}

/**
 * Smart constructor for createing Shared using the environment
 */
export const fromKey = <V>(eq: Eq<V> = deepEqualsEq) => <K extends PropertyKey>(
  key: K,
): Shared<K, { readonly [_ in K]: V }, V> =>
  createShared(
    key,
    asks((e: { readonly [_ in K]: V }) => e[key]),
    eq,
  )
