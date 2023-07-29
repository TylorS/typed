import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'

/**
 * Synchronously map the result to an Effect.
 */
export function mapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx((sink) =>
    fx.run(
      Sink(
        (a) => Effect.matchCauseEffect(f(a), { onFailure: sink.error, onSuccess: sink.event }),
        sink.error,
      ),
    ),
  )
}
