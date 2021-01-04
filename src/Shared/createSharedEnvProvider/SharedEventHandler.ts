import { Effect } from '@fp/Effect/exports'
import { Guard } from 'io-ts/Guard'

import { SharedEnv, SharedEvent } from '../core/exports'

export type SharedEventHandler<A extends SharedEvent> = readonly [
  guard: Guard<unknown, A>,
  handler: (value: A) => Effect<SharedEnv, any>,
]

/**
 * Construct SharedEventHandler instances
 */
export function createSharedEventHandler<A extends SharedEvent>(
  guard: Guard<unknown, A>,
  handler: (value: A) => Effect<SharedEnv, any>,
): SharedEventHandler<A> {
  return [guard, handler]
}
