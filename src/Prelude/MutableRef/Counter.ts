import { MutableRef } from './MutableRef'

export const increment = (ref: MutableRef<number>) => {
  const i = ref.get()

  ref.set(i + 1)

  return i
}

export const decrement = (ref: MutableRef<number>) => {
  const i = Math.max(ref.get() - 1, 0)

  ref.set(i)

  return i
}
