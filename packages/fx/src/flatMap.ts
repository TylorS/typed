import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Cause, Effect, Fiber, Ref, Runtime } from './externals.js'
import { fromEffect } from './fromEffect.js'

export function flatMap<R, E, A, R2, E2, B>(
  fx: Fx<R, E, A>,
  f: (a: A) => Fx<R2, E2, B>,
): Fx<R | R2, E | E2, B> {
  return Fx(<R3>(sink: Sink<R3, E | E2, B>) =>
    Effect.gen(function* ($) {
      const runFork = Runtime.runFork(yield* $(Effect.runtime<R | R2 | R3>()))
      const ref = yield* $(Ref.make<Set<Fiber.RuntimeFiber<never, void>>>(new Set()))

      yield* $(
        fx.run(
          Sink(
            (a: A) =>
              Effect.gen(function* ($) {
                const fiber = runFork(
                  f(a).run(
                    Sink(sink.event, (cause) =>
                      Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                    ),
                  ),
                )
                // Add Fiber to fibers
                yield* $(Ref.update(ref, (fs) => fs.add(fiber)))

                // When the fiber ends, we need to remove it from the list of fibers

                pipe(
                  Fiber.join(fiber),
                  Effect.flatMap(() => Ref.update(ref, (fs) => (fs.delete(fiber), fs))),
                  Effect.catchAllCause((cause) =>
                    Cause.isInterruptedOnly(cause) ? Effect.unit() : sink.error(cause),
                  ),
                  // but don't allow this to be blocking
                  runFork,
                )
              }),
            sink.error,
          ),
        ),
      )

      // Wait for the last fibers to finish
      const fibers = yield* $(Ref.get(ref))

      if (fibers.size > 0) {
        yield* $(Fiber.joinAll(fibers))
      }
    }),
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
