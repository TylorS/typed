import { Env } from './Env'
import { Resume } from './Resume'

export interface Patch<A, B> {
  readonly patch: (a: A, b: B) => Resume<A>
}

export const patch = <A, B>(a: A, b: B): Env<Patch<A, B>, A> => (e) => e.patch(a, b)
