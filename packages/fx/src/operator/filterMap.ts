import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'

export function filterMap<A, B>(f: (a: A) => Option.Option<B>) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, B> => {
    return new FilterMapFx(fx, f)
  }
}

class FilterMapFx<R, E, A, B> extends Fx.Variance<R, E, B> implements Fx<R, E, B> {
  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => Option.Option<B>) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, B>) {
    return this.fx.run(new FilterMapSink(sink, this.f))
  }
}

class FilterMapSink<R, E, A, B> implements Fx.Sink<R, E, A> {
  constructor(readonly sink: Fx.Sink<R, E, B>, readonly f: (a: A) => Option.Option<B>) {}

  event = (a: A) => {
    return pipe(
      this.f(a),
      Option.match(Effect.unit, (a) => this.sink.event(a)),
    )
  }

  error = this.sink.error
  end = this.sink.end
}
