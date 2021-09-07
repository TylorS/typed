import { AtomicReference } from './AtomicReference'

export function incrementAndGet(ref: AtomicReference<number>): number {
  ref.set(ref.get + 1)

  return ref.get
}

export function getAndIncrement(ref: AtomicReference<number>): number {
  const x = ref.get

  ref.set(x + 1)

  return x
}

export function decrementAndGet(ref: AtomicReference<number>): number {
  ref.set(ref.get - 1)

  return ref.get
}

export function getAndDecrement(ref: AtomicReference<number>): number {
  const x = ref.get

  ref.set(x - 1)

  return x
}
