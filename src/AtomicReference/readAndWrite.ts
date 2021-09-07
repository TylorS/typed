import { AtomicReference } from './AtomicReference'

export function readAndWrite<A>(value: A) {
  return (ref: AtomicReference<A>): A => {
    const old = ref.get

    ref.set(value)

    return old
  }
}
