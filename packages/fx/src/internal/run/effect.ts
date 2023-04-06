import { methodWithTrace } from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'

import { Fx } from '../Fx.js'
import { Scope } from '../_externals.js'

import { drain } from './drain.js'

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
