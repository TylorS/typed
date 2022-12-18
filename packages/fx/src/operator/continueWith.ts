import { suspendSucceed } from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function continueWith<R2, E2, B>(f: () => Fx<R2, E2, B>) {
  return <R, E, A>(fx: Fx<R, E, A>): Fx<R | R2, E | E2, A | B> => new ContinueWithFx(fx, f)
}

export class ContinueWithFx<R, E, A, R2, E2, B>
  extends Fx.Variance<R | R2, E | E2, A | B>
  implements Fx<R | R2, E | E2, A | B>
{
  constructor(readonly fx: Fx<R, E, A>, readonly f: () => Fx<R2, E2, B>) {
    super()
  }

  run<R3>(sink: Fx.Sink<R3, E | E2, A | B>) {
    return this.fx.run(new ContinueWithSink(sink, this.f))
  }
}

export class ContinueWithSink<R, E, A, R2, E2, B> {
  constructor(readonly sink: Fx.Sink<R, E | E2, A | B>, readonly f: () => Fx<R2, E2, B>) {}

  event = this.sink.event
  error = this.sink.error
  end = suspendSucceed(() => this.f().run(this.sink))
}
