import { pipe } from '@effect/data/Function'

import { Fx } from './Fx.js'
import { Cause, Effect, Either } from './externals.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'
import { succeed } from './succeed.js'
import { switchMatchCause } from './switchMatch.js'

export function switchMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMatchCause(fx, f, succeed)
}

export function switchMapCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMapCause(fx, (a) => fromEffect(f(a)))
}

export function switchMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMapCause(fx, (cause) =>
    pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
  )
}

export function switchMapErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return switchMapError(fx, (a) => fromEffect(f(a)))
}
