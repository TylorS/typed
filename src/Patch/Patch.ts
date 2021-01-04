import { Arity2 } from '@fp/common/exports'
import { Effect, fromEnv } from '@fp/Effect/exports'
import { Resume } from '@fp/Resume/exports'

/**
 * Environment type for Patching some values.
 */
export interface Patch<A, B> {
  readonly patch: Arity2<A, B, Resume<A>>
}

/**
 * Patch a previous value with a current, generally used for Rendering.
 */
export const patch = <A, B>(a: A, b: B): Effect<Patch<A, B>, A> =>
  fromEnv((e: Patch<A, B>) => e.patch(a, b))
