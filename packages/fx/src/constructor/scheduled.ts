import * as Effect from '@effect/io/Effect'
import type { Schedule } from '@effect/io/Schedule'
import { pipe } from '@fp-ts/core/Function'

import { Fx } from '../Fx.js'

export function scheduled<R2, O>(schedule: Schedule<R2, any, O>) {
  return <R, E, A>(effect: Effect.Effect<R, E, A>) => new ScheduledFx(effect, schedule)
}

class ScheduledFx<R, E, A, R2, O> extends Fx.Variance<R | R2, E, A> {
  constructor(readonly effect: Effect.Effect<R, E, A>, readonly schedule: Schedule<R2, any, O>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E, A>) {
    return pipe(
      this.effect,
      Effect.matchCauseEffect(sink.error, sink.event),
      Effect.schedule(this.schedule),
      Effect.zipRight(sink.end),
    )
  }
}
