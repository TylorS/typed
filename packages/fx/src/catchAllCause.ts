import * as Either from '@effect/data/Either'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'
import { withUnboundedConcurrency } from './helpers.js'

export function catchAllCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx(<R3>(sink: Sink<R3, E2, A | B>) =>
    withUnboundedConcurrency((fork) =>
      fx.run(Sink(sink.event, (cause) => fork(f(cause).run(sink)))),
    ),
  )
}

export function catchAll<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAllCause(fx, (cause) => pipe(cause, Cause.failureOrCause, Either.match(f, failCause)))
}

export function catchAllCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAllCause(fx, (e) => fromEffect(f(e)))
}

export function catchAllEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAll(fx, (e) => fromEffect(f(e)))
}
