import * as Effect from '@effect/io/Effect'
import * as Exit from '@effect/io/Exit'
import { flow, pipe } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'

export function done<E, A>(exit: Exit.Exit<E, A>): Fx<never, E, A> {
  return new DoneFx(exit)
}

export class DoneFx<E, A> extends Fx.Variance<never, E, A> implements Fx<never, E, A> {
  constructor(readonly exit: Exit.Exit<E, A>) {
    super()
  }

  run<R2>(sink: Sink<R2, E, A>) {
    return pipe(this.exit, Exit.match(sink.error, flow(sink.event, Effect.zipRight(sink.end))))
  }
}
