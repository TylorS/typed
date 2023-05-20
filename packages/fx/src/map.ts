import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'

export function map<R, E, A, B>(fx: Fx<R, E, A>, f: (a: A) => B): Fx<R, E, B> {
  return Fx((sink) => fx.run(Sink((a) => Effect.suspend(() => sink.event(f(a))), sink.error)))
}

export function as<R, E, A, B>(fx: Fx<R, E, A>, value: B): Fx<R, E, B> {
  return map(fx, () => value)
}
