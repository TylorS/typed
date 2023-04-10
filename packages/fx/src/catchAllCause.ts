import { pipe } from '@effect/data/Function'

import { Cause, Effect, Either, Fiber, Ref } from './externals.js'

import { Fx, Sink } from './Fx.js'
import { failCause } from './failCause.js'
import { fromEffect } from './fromEffect.js'

export function catchAllCause<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (cause: Cause.Cause<E>) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return Fx((sink) =>
    Effect.scoped(
      Effect.gen(function* ($) {
        const ref = yield* $(Ref.make<Set<Fiber.RuntimeFiber<never, void>>>(new Set()))

        yield* $(
          fx.run(
            Sink(sink.event, (cause: Cause.Cause<E>) =>
              Effect.gen(function* ($) {
                const fiber = yield* $(
                  Effect.forkScoped(
                    f(cause).run(
                      Sink(sink.event, (cause) =>
                        Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                      ),
                    ),
                  ),
                )

                // Add Fiber to fibers
                yield* $(Ref.update(ref, (fs) => fs.add(fiber)))

                // When the fiber ends, we need to remove it from the list of fibers
                yield* $(
                  pipe(
                    Fiber.join(fiber),
                    Effect.flatMap(() =>
                      Ref.update(ref, (fs) => {
                        fs.delete(fiber)
                        return fs
                      }),
                    ),
                    // but don't allow this to be blocking
                    Effect.forkScoped,
                  ),
                )
              }),
            ),
          ),
        )

        // Wait for the last fibers to finish
        const fibers = yield* $(Ref.get(ref))

        if (fibers.size > 0) {
          yield* $(Fiber.joinAll(fibers))
        }
      }),
    ),
  )
}

export function catchAll<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Fx<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAllCause(fx, (cause) => pipe(cause, Cause.failureOrCause, Either.match(f, failCause)))
}

export function catchAllCauseEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: Cause.Cause<E>) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAllCause(fx, (e) => fromEffect(f(e)))
}

export function catchAllEffect<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (e: E) => Effect.Effect<R2, E2, B>,
): Fx<R | R2, E2, A | B> {
  return catchAll(fx, (e) => fromEffect(f(e)))
}
