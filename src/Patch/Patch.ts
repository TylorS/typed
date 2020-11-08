import { Arity2 } from '@typed/fp/common/exports'
import { Effect, fromEnv } from '@typed/fp/Effect/exports'
import { Resume } from '@typed/fp/Resume/exports'

export interface Patch<A, B> {
  readonly patch: Arity2<A, B, Resume<A>>
}

/**
 * Patch a previous value with a current, generally used for Rendering.
 */
export const patch = <A, B>(a: A, b: B): Effect<Patch<A, B>, A> =>
  fromEnv((e: Patch<A, B>) => e.patch(a, b))
