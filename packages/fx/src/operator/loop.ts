import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function loop<B, A, C>(seed: B, f: (b: B, a: A) => readonly [C, B]) {
  return <R, E>(stream: Fx<R, E, A>): Fx<R, E, C> => new LoopFx(stream, seed, f)
}

class LoopFx<R, E, A, B, C> extends Fx.Variance<R, E, C> implements Fx<R, E, C> {
  constructor(
    readonly stream: Fx<R, E, A>,
    readonly seed: B,
    readonly f: (b: B, a: A) => readonly [C, B],
  ) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, C>) {
    return this.stream.run(new LoopSink(sink, this.seed, this.f))
  }
}

class LoopSink<R, E, A, B, C> implements Fx.Sink<R, E, A> {
  protected acc: B = this.seed

  constructor(
    readonly sink: Fx.Sink<R, E, C>,
    readonly seed: B,
    readonly f: (b: B, a: A) => readonly [C, B],
  ) {}

  readonly event = (a: A) =>
    Effect.suspendSucceed(() => {
      const [c, b] = this.f(this.acc, a)

      this.acc = b

      return this.sink.event(c)
    })

  readonly error = this.sink.error
  readonly end = this.sink.end
}
