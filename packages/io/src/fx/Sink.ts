import { Cause } from '@typed/cause'
import { Time } from '@typed/time'

import { Effect } from '../effect/Effect.js'

export interface Sink<R, E, A> {
  readonly event: (time: Time, value: A) => Effect<R, never, unknown>
  readonly error: (time: Time, cause: Cause<E>) => Effect<R, never, unknown>
  readonly end: (time: Time) => Effect<R, never, unknown>
}

export function Sink<R, E, A, R2, R3>(
  event: (time: Time, value: A) => Effect<R, never, unknown>,
  error: (time: Time, cause: Cause<E>) => Effect<R2, never, unknown>,
  end: (time: Time) => Effect<R3, never, unknown>,
): Sink<R | R2 | R3, E, A> {
  return { event, error, end }
}
