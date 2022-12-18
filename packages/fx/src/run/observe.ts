import * as Effect from '@effect/io/Effect'
import { Scope } from '@effect/io/Scope'
import { flow } from '@fp-ts/data/Function'

import { Fx } from '../Fx.js'

import { run_ } from './run.js'

export function observe<A, R2, E2, B>(
  f: (a: A) => Effect.Effect<R2, E2, B>,
): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2, E2 | E, void> {
  return flow(observe_(f), Effect.scoped)
}

export function observe_<A, R2, E2, B>(
  f: (a: A) => Effect.Effect<R2, E2, B>,
): <R, E>(fx: Fx<R, E, A>) => Effect.Effect<R | R2 | Scope, E | E2, void> {
  return run_(f, Effect.failCause, Effect.unit())
}
