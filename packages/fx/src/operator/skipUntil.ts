import { unit } from '@effect/io/Effect'
import type { Predicate } from '@fp-ts/data/Predicate'

import { Fx } from '../Fx.js'

export function skipUntil<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => new SkipUntilFx(fx, predicate)
}

class SkipUntilFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly predicate: Predicate<A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return this.fx.run(new SkipUntilSink(sink, this.predicate))
  }
}

class SkipUntilSink<R, E, A> implements Fx.Sink<R, E, A> {
  protected running = false

  constructor(readonly sink: Fx.Sink<R, E, A>, readonly predicate: Predicate<A>) {}

  event = (a: A) => {
    if (this.running || this.predicate(a)) {
      this.running = true

      return this.sink.event(a)
    }

    return unit()
  }

  error = this.sink.error
  end = this.sink.end
}
