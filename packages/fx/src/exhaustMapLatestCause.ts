import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type { Scope } from '@effect/io/Scope'

import { Cause, Effect, Either, Fiber, Ref } from './externals.js'

import { Fx, Sink } from './Fx.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'

export function exhaustMapLatestCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx(<R3>(sink: Sink<R3, E2, A | B>) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(Ref.make<Fiber.RuntimeFiber<never, void> | void>(void 0))
        const nextValue = yield* $(Ref.make<Option.Option<Cause.Cause<E>>>(Option.none()))
        const reset = Ref.set(ref, void 0)

        // Wait for the current fiber to finish
        const awaitNext = Effect.gen(function* ($) {
          // Wait for the last fiber to finish
          const fiber = yield* $(Ref.get(ref))

          if (fiber) {
            // Wait for the fiber to end to check to see if we need to run another
            yield* $(Fiber.join(fiber))
          }
        })

        // Run the next value that's be saved for replay if it exists
        const runNext: Effect.Effect<R2 | R3 | Scope, never, void> = Effect.gen(function* ($) {
          const next = yield* $(Ref.get(nextValue))

          if (Option.isSome(next)) {
            // Clear the next A to be replayed
            yield* $(Ref.set(nextValue, Option.none()))

            // Replay the next A
            yield* $(exhaustMapLatestError(next.value))

            // Ensure we don't close the scope until the last fiber completes
            yield* $(awaitNext)
          }
        })

        const exhaustMapLatestError = (cause: Cause.Cause<E>) =>
          Effect.gen(function* ($) {
            const currentFiber = yield* $(Ref.get(ref))

            // Always allow the current fiber to continue
            if (currentFiber) {
              // Track the latest A to be replayed layer
              return yield* $(Ref.set(nextValue, Option.some(cause)))
            }

            // Run our Fx with the current value
            const fiber = yield* $(
              pipe(
                f(cause).run(
                  Sink(sink.event, (cause) =>
                    Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                  ),
                ),
                // Clear the current fiber when finished
                Effect.zipRight(reset),
                // See if there's another value to replay
                Effect.zipRight(runNext),
                Effect.catchAllCause((cause) =>
                  Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                ),
                Effect.forkScoped,
              ),
            )

            yield* $(Ref.set(ref, fiber))
          })

        yield* $(fx.run(Sink(sink.event, exhaustMapLatestError)))

        // Wait for the last fiber to finish
        yield* $(awaitNext)
      }),
    ),
  )
}

export function exhaustMapLatestCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, A | B> {
  return exhaustMapLatestCause(fx, (a) => fromEffect(f(a)))
}

export function exhaustMapLatestError<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapLatestCause(fx, (cause) =>
    pipe(cause, Cause.failureOrCause, Either.match(f, failCause)),
  )
}

export function exhaustMapLatestErrorEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (error: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return exhaustMapLatestError(fx, (a) => fromEffect(f(a)))
}
