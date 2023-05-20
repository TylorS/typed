import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { fromEffect } from './fromEffect.js'
import { withExhaust } from './helpers.js'

export function exhaustMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx(<R3>(sink: Sink<R3, E | E2, B>) =>
    withExhaust((fork) => fx.run(Sink((a) => fork(f(a).run(sink)), sink.error))),
  )
}

export function exhaustMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return exhaustMap(fx, (a) => fromEffect(f(a)))
}

export function exhaust<R, E, R2, E2, B>(fx: Fx<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> {
  return exhaustMap(fx, (a) => a)
}

export function exhaustEffect<R, E, R2, E2, B>(
  fx: Fx<R, E, Effect.Effect<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return exhaustMapEffect(fx, (a) => a)
}
