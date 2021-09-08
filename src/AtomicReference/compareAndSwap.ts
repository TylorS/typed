import { AtomicReference } from './AtomicReference'

export function compareAndSwap<A>(old: A, value: A) {
  return (ref: AtomicReference<A>): boolean => {
    if (ref.get !== old) {
      ref.set(value)

      return true
    }

    return false
  }
}
