import { Fx, Sink } from './Fx.js'
import { Effect, Option } from './externals.js'

export function filterMap<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => Option.Option<B>): Fx<R, E, B> {
  return Fx((sink) => fx.run(Sink((a) => Option.match(f(a), Effect.unit, sink.event), sink.error)))
}

export function compact<R, E, A>(fx: Fx<R, E, Option.Option<A>>): Fx<R, E, A> {
  return filterMap(fx, (a) => a)
}
