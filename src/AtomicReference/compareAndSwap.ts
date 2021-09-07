import { Eq } from 'fp-ts/Eq'

import { AtomicReference } from './AtomicReference'

export function compareAndSwap<A>(E: Eq<A>) {
  return (old: A, value: A) =>
    (ref: AtomicReference<A>): boolean => {
      if (!E.equals(ref.get, old)) {
        ref.set(value)

        return true
      }

      return false
    }
}
