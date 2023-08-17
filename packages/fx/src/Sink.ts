import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

export interface Sink<R, E, A> {
  readonly event: (a: A) => Effect.Effect<R, never, void>
  readonly error: (e: Cause.Cause<E>) => Effect.Effect<R, never, void>
}

export function Sink<A, R, E, R2>(
  event: (a: A) => Effect.Effect<R, never, void>,
  error: (e: Cause.Cause<E>) => Effect.Effect<R2, never, void>,
): Sink<R | R2, E, A> {
  return {
    event,
    error,
  }
}
