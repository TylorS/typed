import { deepEqualsEq } from '@typed/fp/common/exports'
import { Effect, ReturnOf } from '@typed/fp/Effect/exports'
import { createSchema } from '@typed/fp/io/exports'
import { Eq } from 'fp-ts/Eq'
import { HKT } from 'fp-ts/lib/HKT'

/**
 * A shared value that can be used to dynamically keep track of state
 */
export interface Shared<K extends PropertyKey = PropertyKey, E = unknown, A = any> {
  readonly key: K
  readonly initial: Effect<E, A>
  readonly eq: Eq<A>
}

export namespace Shared {
  export const schema = createSchema<Shared>((t) =>
    t.type({
      key: t.union(t.string, t.number, t.symbol),
      initial: t.unknown as HKT<any, Shared['initial']>,
      eq: t.unknown as HKT<any, Shared['eq']>,
    }),
  )
}

/**
 * Get the key of a shared value type
 */
export type KeyOf<A extends Shared> = A['key']

/**
 * Get the value of a shared value type
 */
export type ValueOf<A extends Shared> = ReturnOf<A['initial']>

/**
 * Contstruct a share value
 */
export function shared<K extends PropertyKey, E, A>(
  key: K,
  initial: Effect<E, A>,
  eq: Eq<A> = deepEqualsEq,
): Shared<K, E, A> {
  return {
    key,
    initial,
    eq,
  }
}
