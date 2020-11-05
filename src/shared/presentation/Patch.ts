import { fromEnv } from '@typed/fp/Effect/fromEnv'
import type { Resume } from '@typed/fp/Resume/exports'

export interface Patch<A, B> {
  readonly patch: (a: A, b: B) => Resume<A>
}

export const patch = <A, B>(a: A, b: B) => fromEnv((e: Patch<A, B>) => e.patch(a, b))
