import * as Effect from '@effect/io/Effect'

import { Fx } from './Fx.js'

export function fromFxEffect<R, E, R2, E2, B>(
  effect: Effect.Effect<R, E, Fx<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return Fx((sink) =>
    Effect.matchCauseEffect(effect, { onFailure: sink.error, onSuccess: (fx) => fx.run(sink) }),
  )
}
