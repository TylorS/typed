import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function interruptible<R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
  return new InterruptibleFx(fx)
}

export class InterruptibleFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E, A>) {
    return pipe(this.fx.run(sink), Effect.interruptible)
  }
}
