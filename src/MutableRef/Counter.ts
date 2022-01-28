import { MutableRef } from './MutableRef'

export const increment = (ref: MutableRef<number>) => {
  const i = ref.get()

  ref.set(i + 1)

  return i
}

export const decrement = (ref: MutableRef<number>) => {
  const i = ref.get() - 1

  ref.set(i)

  return i
}
