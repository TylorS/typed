import { Resume } from '@typed/fp/Resume'

export interface Patch<A, B> {
  readonly patch: (a: A, b: B) => Resume<A>
}
