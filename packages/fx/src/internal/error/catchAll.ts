import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'

import { fromEffect } from '../conversion/fromEffect.js'

import type { Fx } from '@typed/fx/internal/Fx'
import { Cause, Either, Effect } from '@typed/fx/internal/_externals'
import { failCause } from '@typed/fx/internal/constructor/index'
import { catchAllCause } from '@typed/fx/internal/error/catchAllCause'

export const catchAll: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B>
  <E, R2, E2, B>(f: (e: E) => Fx<R2, E2, B>): <R, A>(fx: Fx<R, E, A>) => Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Fx<R2, E2, B>): Fx<R | R2, E2, A | B> =>
      catchAllCause(fx, (cause) =>
        pipe(cause, Cause.failureOrCause, Either.match(f, failCause)).traced(trace),
      ),
)

export const catchAllEffect: {
  <R, E, A, R2, E2, B>(fx: Fx<R, E, A>, f: (e: E) => Effect.Effect<R2, E2, B>): Fx<
    R | R2,
    E2,
    A | B
  >
  <E, R2, E2, B>(f: (e: E) => Effect.Effect<R2, E2, B>): <R, A>(
    fx: Fx<R, E, A>,
  ) => Fx<R | R2, E2, A | B>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2, B>(
      fx: Fx<R, E, A>,
      f: (e: E) => Effect.Effect<R2, E2, B>,
    ): Fx<R | R2, E2, A | B> =>
      catchAll(fx, (e) => fromEffect(f(e))).traced(trace),
)
