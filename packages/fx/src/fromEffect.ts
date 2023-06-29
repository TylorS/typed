import type { Trace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { Fx, FxTypeId, Sink, Traced } from './Fx.js'

export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx<R, E, A> {
  return new FromEffect(effect)
}

class FromEffect<R, E, A> implements Fx<R, E, A> {
  readonly [FxTypeId]!: Fx<R, E, A>[FxTypeId]

  constructor(readonly effect: Effect.Effect<R, E, A>) {}

  run<R2>(sink: Sink<R2, E, A>): Effect.Effect<R | R2, never, void> {
    return Effect.matchCauseEffect(this.effect, sink.error, sink.event)
  }

  addTrace(trace: Trace): Fx<R, E, A> {
    return Traced(this, trace)
  }
}
