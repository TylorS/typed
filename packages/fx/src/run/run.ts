import { Cause } from '@effect/io/Cause'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import { Scope } from '@effect/io/Scope'
import { flow, pipe } from '@fp-ts/data/Function'

import { Fx, Sink } from '../Fx.js'

export function run<A, R2, E2, E, R3, E3, B, R4, E4>(
  event: (a: A) => Effect.Effect<R2, E2, any>,
  error: (cause: Cause<E>) => Effect.Effect<R3, E3, B>,
  end: Effect.Effect<R4, E4, B>,
): <R>(fx: Fx<R, E, A>) => Effect.Effect<R | R2 | R3 | R4, E2 | E3 | E4, B> {
  return flow(run_(event, error, end), Effect.scoped)
}

export function run_<A, R2, E2, E, R3, E3, B, R4, E4>(
  event: (a: A) => Effect.Effect<R2, E2, any>,
  error: (cause: Cause<E>) => Effect.Effect<R3, E3, B>,
  end: Effect.Effect<R4, E4, B>,
) {
  return <R>(fx: Fx<R, E, A>): Effect.Effect<R | R2 | R3 | R4 | Scope, E2 | E3 | E4, B> =>
    Effect.gen(function* ($) {
      const deferred = yield* $(Deferred.make<E2 | E3 | E4, B>())
      const sink = Sink(
        flow(
          event,
          Effect.matchCauseEffect(
            (cause) =>
              Effect.sync(() =>
                pipe(deferred, Deferred.unsafeDone<E2 | E3 | E4, B>(Effect.failCause(cause))),
              ),
            Effect.unit,
          ),
        ),
        flow(error, Effect.intoDeferred(deferred)),
        pipe(end, Effect.intoDeferred(deferred)),
      )

      const fiber = yield* $(Effect.forkScoped(fx.run(sink)))

      const c = yield* $(Deferred.await(deferred))

      yield* $(Fiber.interrupt(fiber))

      return c
    })
}
