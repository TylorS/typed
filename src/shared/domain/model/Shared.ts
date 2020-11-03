import { Effect, EnvOf as EffEnv, ReturnOf } from '@typed/fp/Effect/exports'
import { createSchema } from '@typed/fp/io/exports'
import { Eq } from 'fp-ts/Eq'
import { flow } from 'fp-ts/function'
import { HKT } from 'fp-ts/HKT'
import { some } from 'fp-ts/Option'

import { SharedKey } from './SharedKey'

/**
 * A shared value that can be used to track values at a given key
 */
export interface Shared<K extends SharedKey = SharedKey, E = any, A = any> {
  readonly key: K
  readonly initial: Effect<E, A>
  readonly eq: Eq<A>
}

export namespace Shared {
  export const schema = createSchema<Shared>((t) =>
    t.type({
      key: t.newtype(
        t.union(t.string, t.number, t.symbol),
        flow(SharedKey.wrap, some),
        'SharedKey',
      ),
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
 * Get the requirements for a Shared value to satisfy it's
 * type-signature.
 */
export type EnvOf<A extends Shared> = EffEnv<A['initial']>
