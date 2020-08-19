import { Effect } from '@typed/fp/Effect'

export interface Channel<E, A> {
  readonly defaultValue: Effect<E, A>
}
