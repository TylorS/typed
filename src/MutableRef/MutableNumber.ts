import { MutableRef } from './MutableRef'

export function getAndIncrement(n: MutableRef<number>): number {
  const i = n.get()

  n.set(i + 1)

  return i
}

export function incrementAndGet(n: MutableRef<number>): number {
  const i = n.get() + 1

  n.set(i)

  return i
}

export function getAndDecrement(n: MutableRef<number>): number {
  const i = n.get()

  n.set(i - 1)

  return i
}

export function decrementAndGet(n: MutableRef<number>): number {
  const i = n.get() - 1

  n.set(i)

  return i
}
