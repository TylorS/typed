import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'
import { withExhaustLatest } from './helpers.js'

export function exhaustMapLatestCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx(<R3>(sink: Sink<R3, E2, A | B>) =>
    withExhaustLatest((fork) => fx.run(Sink(sink.event, (cause) => fork(f(cause).run(sink))))),
  )
}

export function exhaustMapLatestCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return exhaustMapLatestCause(fx, (a) => fromEffect(f(a)))
}

export function exhaustMapLatestError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapLatestCause(fx, (cause) =>
    pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
  )
}

export function exhaustMapLatestErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapLatestError(fx, (a) => fromEffect(f(a)))
}
