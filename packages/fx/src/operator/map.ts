import { Fx } from '../Fx.js'

export function map<A, B>(f: (a: A) => B) {
  return <R, E>(fx: Fx<R, E, A>): Fx<R, E, B> => new MapFx(fx, f)
}

class MapFx<R, E, A, B> extends Fx.Variance<R, E, B> implements Fx<R, E, B> {
  constructor(readonly fx: Fx<R, E, A>, readonly f: (a: A) => B) {
    super()
  }

  run<R2>(sink: Fx.Sink<R2, E, B>) {
    return this.fx.run(new MapSink(sink, this.f))
  }
}

class MapSink<R, E, A, B> implements Fx.Sink<R, E, A> {
  constructor(readonly sink: Fx.Sink<R, E, B>, readonly f: (a: A) => B) {}

  event = (a: A) => {
    return this.sink.event(this.f(a))
  }

  error = this.sink.error
  end = this.sink.end
}
