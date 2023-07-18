import * as Cause from '@effect/io/Cause'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import type { Scope } from '@effect/io/Scope'

import type { Fx } from './Fx.js'
import { Sink } from './Fx.js'

export function observe<R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, void>,
): Effect.Effect<R | R2 | Scope, E | E2, void> {
  return Effect.flatMap(Deferred.make<E | E2, void>(), (deferred) => {
    const error = (cause: Cause.Cause<E | E2>) => Deferred.failCause(deferred, cause)
    const end = () => Deferred.succeed(deferred, undefined)

    return Effect.flatMap(
      Effect.forkScoped(
        Effect.flatMap(fx.run(Sink((a: A) => Effect.catchAllCause(f(a), error), error)), end),
      ),
      (fiber) => Effect.flatMap(Deferred.await(deferred), () => Fiber.interruptFork(fiber)),
    )
  })
}

export function drain<R, E, A>(fx: Fx<R, E, A>): Effect.Effect<R | Scope, E, void> {
  return observe(fx, Effect.unit as any)
}

export function forkScoped<R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope, never, Fiber.RuntimeFiber<E, void>> {
  return Effect.forkScoped(drain(fx))
}

export function fork<R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope, never, Fiber.RuntimeFiber<E, void>> {
  return Effect.fork(drain(fx))
}
