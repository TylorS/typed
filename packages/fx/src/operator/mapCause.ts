import { Cause } from '@effect/io/Cause'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

export function mapCause<E, E2>(
  f: (e: Cause<E>) => Cause<E2>,
): <R, A>(fx: Fx<R, E, A>) => Fx<R, E2, A> {
  return (fx) => new MapCauseFx(fx, f)
}

class MapCauseFx<R, E, A, E2> extends Fx.Variance<R, E2, A> implements Fx<R, E2, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly f: (e: Cause<E>) => Cause<E2>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E2, A>) {
    return this.fx.run({
      ...sink,
      error: flow(this.f, sink.error),
    })
  }
}
