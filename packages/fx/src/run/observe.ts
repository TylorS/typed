import { flow } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import type { Fx } from '../Fx.js'
import { disableCooperativeYielding } from '../_internal/disableCooperativeYielding.js'

import { run_ } from './run.js'

export function observe<A, R2, E2, B>(
  f: (a: A) => Effect.Effect<R2, E2, B>,
): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E2 | E, void> {
  return flow(observe_(f), Effect.scoped, disableCooperativeYielding)
}

export function observeSync<A, B>(
  f: (a: A) => B,
): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R, E, void> {
  return flow(
    observe_((a) => Effect.sync(() => f(a))),
    Effect.scoped,
  )
}

export function observe_<A, R2, E2, B>(
  f: (a: A) => Effect.Effect<R2, E2, B>,
): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2 | Scope, E | E2, void> {
  return run_(f, Effect.failCause, Effect.unit())
}
