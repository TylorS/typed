import { unit } from '@effect/io/Effect'
import type { Predicate } from '@fp-ts/core/Predicate'

import { Fx } from '../Fx.js'

export function skipAfter<A>(predicate: Predicate<A>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, A> => new SkipAfterFx(fx, predicate)
}

class SkipAfterFx<R, E, A> extends Fx.Variance<R, E, A> implements Fx<R, E, A> {
  constructor(readonly fx: Fx<R, E, A>, readonly predicate: Predicate<A>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, A>) {
    return this.fx.run(new SkipAfterSink(sink, this.predicate))
  }
}

class SkipAfterSink<R, E, A> implements Fx.Sink<R, E, A> {
  protected running = true

  constructor(readonly sink: Fx.Sink<R, E, A>, readonly predicate: Predicate<A>) {}

  event = (a: A) => {
    const passed = this.predicate(a)

    if (this.running && !passed) {
      return this.sink.event(a)
    } else if (passed) {
      this.running = false
    }

    return unit()
  }

  error = this.sink.error
  end = this.sink.end
}
