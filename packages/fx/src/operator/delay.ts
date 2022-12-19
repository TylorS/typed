import * as Effect from '@effect/io/Effect'
import { Duration } from '@fp-ts/data/Duration'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function delay(duration: Duration) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> => new DelayFx(fx, duration)
}

export class DelayFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly duration: Duration) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return this.fx.run(Fx.Sink(flow(sink.event, Effect.delay(this.duration)), sink.error, sink.end))
  }
}
