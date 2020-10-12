import { Effect } from '@typed/fp/Effect/Effect'
import { SharedQueue, wrapSharedQueue } from '@typed/fp/Queue/exports'
import { createSharedRef, SharedRefEnv } from '@typed/fp/SharedRef/exports'

export const EFFECT_QUEUE = '@typed/fp/hooks/EffectQueue'
export type EFFECT_QUEUE = typeof EFFECT_QUEUE

export interface EffectQueue extends SharedQueue<EFFECT_QUEUE, readonly [Effect<any, any>, any]> {}

export const EffectQueue = createSharedRef<EffectQueue>(EFFECT_QUEUE)

export const effectQueue = wrapSharedQueue(EffectQueue)

/**
 * Add an effect to be run later
 */
export const addEffect = <E, A>(
  effect: Effect<E, A>,
  env: E,
): Effect<SharedRefEnv<EffectQueue>, void> => effectQueue.enqueue([effect, env])
