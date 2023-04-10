import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type { Scope } from '@effect/io/Scope'

import { Cause, Effect, Fiber, Ref } from './externals.js'

import { Fx, Sink } from './Fx.js'
import { fromEffect } from './fromEffect.js'

export function exhaustMapLatest<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx(<R3>(sink: Sink<R3, E | E2, B>) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(Ref.make<Fiber.RuntimeFiber<never, void> | void>(void 0))
        const nextValue = yield* $(Ref.make<Option.Option<A>>(Option.none()))
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
            yield* $(exhaustMapLatestEvent(next.value))

            // Ensure we don't close the scope until the last fiber completes
            yield* $(awaitNext)
          }
        })

        const exhaustMapLatestEvent = (a: A) =>
          Effect.gen(function* ($) {
            const currentFiber = yield* $(Ref.get(ref))

            // Always allow the current fiber to continue
            if (currentFiber) {
              // Track the latest A to be replayed layer
              return yield* $(Ref.set(nextValue, Option.some(a)))
            }

            // Run our Fx with the current value
            const fiber = yield* $(
              pipe(
                f(a).run(
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

        yield* $(fx.run(Sink(exhaustMapLatestEvent, sink.error)))

        // Wait for the last fiber to finish
        yield* $(awaitNext)
      }),
    ),
  )
}

export function exhaustMapLatestEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return exhaustMapLatest(fx, (a) => fromEffect(f(a)))
}

export function exhaustLatest<R, E, R2, E2, B>(fx: Fx<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> {
  return exhaustMapLatest(fx, (a) => a)
}

export function exhaustLatestEffect<R, E, R2, E2, B>(
  fx: Fx<R, E, Effect.Effect<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return exhaustMapLatestEffect(fx, (a) => a)
}
