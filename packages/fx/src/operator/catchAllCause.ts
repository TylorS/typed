import { Cause } from '@effect/io/Cause'

import { Fx } from '../Fx.js'

export function catchAllCause<E, R2, E2, B>(f: (cause: Cause<E>) => Fx<R2, E2, B>) {
  return <R, A>(fx: Fx<R, E, A>): Fx<R | R2, E2, A | B> => new CatchAllCauseFx(fx, f)
}

export class CatchAllCauseFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E2, A | B>
  implements Fx<R | R2, E2, A | B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: (cause: Cause<E>) => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E2, A | B>) {
    return this.fx.run(new CatchAllCauseSink(sink, this.f))
  }
}

export class CatchAllCauseSink<R, E, A, R2, E2, B> {
  constructor(
    readonly sink: Fx.Sink<R, E2, A | B>,
    readonly f: (cause: Cause<E>) => Fx<R2, E2, B>,
  ) {}

  event = this.sink.event
  error = (cause: Cause<E>) => this.f(cause).run(this.sink)
  end = this.sink.end
}
