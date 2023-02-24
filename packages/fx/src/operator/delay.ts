import type { Duration } from '@effect/data/Duration'
import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function delay(duration: Duration) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new DelayFx(fx, duration)
}

class DelayFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly duration: Duration) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return this.fx.run(Fx.Sink(flow(sink.event, Effect.delay(this.duration)), sink.error, sink.end))
  }
}
