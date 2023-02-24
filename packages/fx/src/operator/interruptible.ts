import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function interruptible<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return new InterruptibleFx(fx)
}

class InterruptibleFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E, A>) {
    return pipe(this.fx.run(sink), Effect.interruptible)
  }
}
