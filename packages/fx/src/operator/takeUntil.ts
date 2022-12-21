import { pipe } from '@fp-ts/data/Function'
import { Predicate } from '@fp-ts/data/Predicate'

import { Fx } from '../Fx.js'
import { catchEarlyExit, earlyExit } from '../_internal/earlyExit.js'

export function takeUntil<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => new TakeUntilFx(fx, predicate)
}

class TakeUntilFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly predicate: Predicate<A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return pipe(this.fx.run(new TakeUntilSink(sink, this.predicate)), catchEarlyExit(sink.end))
  }
}

class TakeUntilSink<R, E, A> implements Fx.Sink<R, E, A> {
  constructor(readonly sink: Fx.Sink<R, E, A>, readonly predicate: Predicate<A>) {}

  event = (a: A) => {
    if (this.predicate(a)) {
      return earlyExit
    }

    return this.sink.event(a)
  }

  error = this.sink.error
  end = this.sink.end
}
