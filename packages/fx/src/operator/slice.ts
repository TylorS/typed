import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/core/Function'

import { Fx } from '../Fx.js'
import { withEarlyExit } from '../_internal/earlyExit.js'

export function slice(skip: number, take: number) {
  return function <R, E, A>(fx: Fx<R, E, A>): Fx<R, E, A> {
    return new SliceFx(fx, skip, take)
  }
}

class SliceFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly skip: number, readonly take: number) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return withEarlyExit(
      (earlyExit) => this.fx.run(new SliceSink(sink, this.skip, this.take, earlyExit)),
      sink.end,
    )
  }
}

class SliceSink<R, E, A> implements Fx.Sink<R, E, A> {
  constructor(
    readonly sink: Fx.Sink<R, E, A>,
    protected skip: number,
    protected take: number,
    readonly earlyExit: Effect.Effect<never, never, never>,
  ) {}

  event = (a: A) => {
    if (this.skip > 0) {
      this.skip--
      return Effect.unit()
    }

    if (this.take === 0) {
      return Effect.unit()
    }

    return pipe(
      this.sink.event(a),
      Effect.tap(() => (--this.take === 0 ? this.earlyExit : Effect.unit())),
    )
  }

  error = this.sink.error
  end = this.sink.end
}
