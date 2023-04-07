import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { drain } from './drain.js'

import { Fx } from '@typed/fx/internal/Fx'
import { Scope } from '@typed/fx/internal/externals'

export const forkDaemon: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, unknown> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, unknown> =>
        Effect.forkDaemon(drain(fx)).traced(trace),
  )

export const forkScoped: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R | Scope.Scope, E, unknown> =
  methodWithTrace(
    (trace) =>
      <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R | Scope.Scope, E, unknown> =>
        Effect.forkScoped(drain(fx)).traced(trace),
  )

export const fork: <R, E, A>(fx: Fx<R, E, A>) => Effect.Effect<R, E, unknown> = methodWithTrace(
  (trace) =>
    <R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R, E, unknown> =>
      Effect.fork(drain(fx)).traced(trace),
)
