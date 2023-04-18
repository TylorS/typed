import { pipe } from '@effect/data/Function'

import { Fx, Sink } from './Fx.js'
import { Duration, Runtime, Effect, Fiber, Ref } from './externals.js'

export function throttle<R, E, A>(fx: Fx<R, E, A>, duration: Duration.Duration): Fx<R, E, A> {
  return Fx(<R2>(sink: Sink<R2, E, A>) =>
    Effect.gen(function* ($) {
      const runFork = Runtime.runFork(yield* $(Effect.runtime<R | R2>()))
      const ref = yield* $(Ref.make<Fiber.RuntimeFiber<never, void> | void>(void 0))
      const reset = Ref.set(ref, void 0)

      const throttleEvent = (a: A) =>
        Effect.gen(function* ($) {
          const currentFiber = yield* $(Ref.get(ref))

          if (currentFiber) {
            return
          }

          yield* $(
            Ref.set(
              ref,
              pipe(sink.event(a), Effect.zipLeft(Effect.delay(reset, duration)), runFork),
            ),
          )
        })

      yield* $(fx.run(Sink(throttleEvent, sink.error)))

      // Wait for the last fiber to finish
      const fiber = yield* $(Ref.get(ref))

      if (fiber) {
        yield* $(Fiber.join(fiber))
      }
    }),
  )
}
