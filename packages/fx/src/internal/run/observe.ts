import { dualWithTrace } from '@effect/data/Debug'
import { pipe } from '@effect/data/Function'
import type { Cause } from '@effect/io/Cause'
import { isInterruptedOnly } from '@effect/io/Cause'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import type { Scope } from '@effect/io/Scope'

import type { Fx } from '@typed/fx/internal/Fx'
import { Sink } from '@typed/fx/internal/Fx'

export const observe: {
  <R, E, A, R2, E2>(fx: Fx<R, E, A>, f: (a: A) => Effect.Effect<R2, E2, unknown>): Effect.Effect<
    R | R2,
    E | E2,
    void
  >
  <A, R2, E2>(f: (a: A) => Effect.Effect<R2, E2, unknown>): <R, E>(
    fx: Fx<R, E, A>,
  ) => Effect.Effect<R | R2, E | E2, void>
} = dualWithTrace(
  2,
  (trace) =>
    <R, E, A, R2, E2>(
      fx: Fx<R, E, A>,
      f: (a: A) => Effect.Effect<R2, E2, unknown>,
    ): Effect.Effect<R | R2, E | E2, void> =>
      Effect.scoped(observe_(fx, f)).traced(trace),
)

const observe_ = <R, E, A, R2, E2>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, unknown>,
): Effect.Effect<R | R2 | Scope, E | E2, void> =>
  Effect.gen(function* ($) {
    const context = yield* $(Effect.context<R | R2 | Scope>())
    const deferred = yield* $(Deferred.make<E | E2, void>())
    const end = Deferred.succeed(deferred, undefined)
    const error = (cause: Cause<E | E2>) =>
      isInterruptedOnly(cause) ? end : Deferred.failCause(deferred, cause)

    yield* $(
      Effect.forkScoped(
        fx.run(
          Sink(
            (a) => pipe(a, f, Effect.catchAllCause(error), Effect.provideContext(context)),
            error,
            () => end,
          ),
        ),
      ),
    )

    return yield* $(Deferred.await(deferred))
  })
