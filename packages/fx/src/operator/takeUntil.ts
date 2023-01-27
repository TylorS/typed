import type { Effect } from '@effect/io/Effect'
import type { Predicate } from '@fp-ts/core/Predicate'

import { Fx } from '../Fx.js'
import { withEarlyExit } from '../_internal/earlyExit.js'

export function takeUntil<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => new TakeUntilFx(fx, predicate)
}

class TakeUntilFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly predicate: Predicate<A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return withEarlyExit(
      (earlyExit) => this.fx.run(new TakeUntilSink(sink, this.predicate, earlyExit)),
      sink.end,
    )
  }
}

class TakeUntilSink<R, E, A> implements Fx.Sink<R, E, A> {
  constructor(
    readonly sink: Fx.Sink<R, E, A>,
    readonly predicate: Predicate<A>,
    readonly earlyExit: Effect<never, never, never>,
  ) {}

  event = (a: A) => {
    if (this.predicate(a)) {
      return this.earlyExit
    }

    return this.sink.event(a)
  }

  error = this.sink.error
  end = this.sink.end
}
