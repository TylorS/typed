import * as Effect from '@effect/io/Effect'
import { flow } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
  return new FromEffect(effect)
}

class FromEffect<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly effect: Effect.Effect<R, E, A>) {
    super()
  }

  run<R2>(sink: Sink<R2, E, A>) {
    return Effect.matchCauseEffect(
      sink.error,
      flow(sink.event, Effect.zipRight(sink.end)),
    )(this.effect)
  }
}
