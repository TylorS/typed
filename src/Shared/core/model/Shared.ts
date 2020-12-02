import type { Effect, EnvOf as EffEnv, ReturnOf } from '@typed/fp/Effect/exports'
import { createSchema } from '@typed/fp/io/exports'
import type { Eq } from 'fp-ts/Eq'
import { flow } from 'fp-ts/function'
import type { HKT } from 'fp-ts/HKT'
import { some } from 'fp-ts/Option'

import { SharedKey } from './SharedKey'

/**
 * A Shared instance is a Effect-based abstraction for key-value pairs with lifecycle
 * events and optional namespacing.
 */
export interface Shared<K extends SharedKey = SharedKey, E = any, A = any> {
  readonly key: K
  readonly initial: Effect<E, A>
  readonly eq: Eq<A>
}

export namespace Shared {
  export const schema = createSchema<Shared>((t) =>
    t.type({
      key: t.newtype(t.propertyKey, flow(SharedKey.wrap, some), 'SharedKey'),
      initial: t.unknown as HKT<any, Shared['initial']>,
      eq: t.unknown as HKT<any, Shared['eq']>,
    }),
  )
}

/**
 * Get the key of a shared value type
 */
export type GetSharedKey<A extends Shared> = A['key']

/**
 * Get the value of a shared value type
 */
export type GetSharedValue<A extends Shared> = ReturnOf<A['initial']>

/**
 * Get the requirements for a Shared value to satisfy it's
 * type-signature.
 */
export type GetSharedEnv<A extends Shared> = EffEnv<A['initial']>
