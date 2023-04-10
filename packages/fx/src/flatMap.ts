import { pipe } from '@effect/data/Function'

import { Cause, Effect, Fiber, Ref } from './externals.js'

import { Fx, Sink } from './Fx.js'
import { fromEffect } from './fromEffect.js'

export function flatMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx((sink) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(Ref.make<ReadonlyArray<Fiber.RuntimeFiber<never, void>>>([]))

        yield* $(
          fx.run(
            Sink(
              (a: A) =>
                Effect.gen(function* ($) {
                  const fiber = yield* $(
                    Effect.forkScoped(
                      f(a).run(
                        Sink(sink.event, (cause) =>
                          Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                        ),
                      ),
                    ),
                  )

                  // Add Fiber to fibers
                  yield* $(Ref.update(ref, (fs) => [...fs, fiber]))

                  // When the fiber ends, we need to remove it from the list of fibers
                  yield* $(
                    pipe(
                      Fiber.join(fiber),
                      Effect.flatMap(() => Ref.update(ref, (fs) => fs.filter((f) => f !== fiber))),
                      Effect.catchAllCause((cause) =>
                        Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                      ),
                      // but don't allow this to be blocking
                      Effect.forkScoped,
                    ),
                  )
                }),
              sink.error,
            ),
          ),
        )

        // Wait for the last fibers to finish
        const fibers = yield* $(Ref.get(ref))

        if (fibers.length > 0) {
          yield* $(Fiber.joinAll(fibers))
        }
      }),
    ),
  )
}

export function flatMapEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return flatMap(fx, (a) => fromEffect(f(a)))
}

export function flatten<R, E, R2, E2, B>(fx: Fx<R, E, Fx<R2, E2, B>>): Fx<R | R2, E | E2, B> {
  return flatMap(fx, (a) => a)
}

export function flattenEffect<R, E, R2, E2, B>(
  fx: Fx<R, E, Effect.Effect<R2, E2, B>>,
): Fx<R | R2, E | E2, B> {
  return flatMapEffect(fx, (a) => a)
}
