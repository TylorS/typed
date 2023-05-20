import * as Either from '@effect/data/Either'
import { pipe } from '@effect/data/Function'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'

import { Fx, Sink } from './Fx.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'
import { withSwitch } from './helpers.js'

export function switchMatchCause<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return Fx((sink) =>
    withSwitch((fork) =>
      fx.run(
        Sink(
          (a) => fork(g(a).run(sink)),
          (cause) => fork(f(cause).run(sink)),
        ),
      ),
    ),
  )
}

export function switchMatch<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (error: E) => Fx<R2, E2, B>,
  g: (a: A) => Fx<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatchCause(
    fx,
    (cause) => pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
    g,
  )
}

export function switchMatchCauseEffect<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
  g: (a: A) => Effect.Effect<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatchCause(
    fx,
    (a) => fromEffect(f(a)),
    (b) => fromEffect(g(b)),
  )
}

export function switchMatchEffect<R, E, A, R2, E2, B, R3, E3, C>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
  g: (a: A) => Effect.Effect<R3, E3, C>,
): Fx<R | R2 | R3, E2 | E3, B | C> {
  return switchMatch(
    fx,
    (a) => fromEffect(f(a)),
    (b) => fromEffect(g(b)),
  )
}
