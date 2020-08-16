import { Effect } from '@typed/fp/Effect'

// Channel reference is used to distinguish
export interface Channel<E, A> {
  readonly defaultValue: Effect<E, A>
}

export function createChannel<E, A>(defaultValue: Effect<E, A>): Channel<E, A> {
  return { defaultValue }
}
