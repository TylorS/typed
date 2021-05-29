import { Env } from '@fp/Env'
import { Resume } from '@fp/Resume'

export interface Patch<A, B> {
  readonly patch: (a: A, b: B) => Resume<A>
}

export const patch = <A, B>(a: A, b: B): Env<Patch<A, B>, A> => (e) => e.patch(a, b)
