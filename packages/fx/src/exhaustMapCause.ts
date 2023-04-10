import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Cause, Effect, Either, Fiber, Ref } from './externals.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'

export function exhaustMapCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx((sink) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(Ref.make<Fiber.RuntimeFiber<never, void> | void>(void 0))
        const reset = Ref.set(ref, void 0)

        const exhaustMapError = (cause: Cause.Cause<E>) =>
          Effect.gen(function* ($) {
            const currentFiber = yield* $(Ref.get(ref))

            if (currentFiber) {
              return
            }

            const fiber = yield* $(
              pipe(
                f(cause).run(
                  Sink(sink.event, (cause) =>
                    Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                  ),
                ),
                Effect.zipLeft(reset),
                Effect.catchAllCause((cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
                Effect.forkScoped,
              ),
            )

            yield* $(Ref.set(ref, fiber))
          })

        yield* $(fx.run(Sink(sink.event, exhaustMapError)))

        // Wait for the last fiber to finish
        const fiber = yield* $(Ref.get(ref))

        if (fiber) {
          yield* $(Fiber.join(fiber))
        }
      }),
    ),
  )
}

export function exhaustMapCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return exhaustMapCause(fx, (a) => fromEffect(f(a)))
}

export function exhaustMapError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapCause(fx, (cause) =>
    pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
  )
}

export function exhaustMapErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapError(fx, (a) => fromEffect(f(a)))
}
