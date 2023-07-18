import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'
import { withExhaust } from './helpers.js'

export function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx(<R3>(sink: Sink<R3, E2, A | B>) =>
    withExhaust((fork) => fx.run(Sink(sink.event, (cause) => fork(f(cause).run(sink))))),
  )
}

export function exhaustMapCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return exhaustMapCause(fx, (a) => fromEffect(f(a)))
}

export function exhaustMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapCause(fx, (cause) =>
    pipe(cause, Cause.failureOrCause, Either.match({ onLeft: f, onRight: failCause })),
  )
}

export function exhaustMapErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapError(fx, (a) => fromEffect(f(a)))
}
